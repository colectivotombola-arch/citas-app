-- This SQL file defines the database schema for the Quedamos Hoy dating app.
-- It creates tables for user profiles, likes, passes, matches, messages,
-- subscriptions, premium usage (e.g. rewinds), verification requests and
-- analytics events.  It also defines helper functions to enforce usage
-- quotas (rewinds per day, message rate limits) and to fetch potential
-- matches within a distance and age range.

-- Enable the PostGIS extension for distance calculations.
create extension if not exists postgis;

-- Profiles table.  Each authenticated user has a corresponding profile row.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text,
  bio text,
  gender text,
  birthdate date,
  photo_url text,
  location geography(Point, 4326), -- latitude/longitude stored as geography
  distance_preference integer default 50, -- maximum distance in km
  min_age integer default 18,
  max_age integer default 99,
  is_verified boolean default false,
  onboarded boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create index if not exists profiles_location_idx on profiles using gist (location);

-- Likes table.  Records when one user likes another.  Unique constraint
-- prevents duplicate likes.
create table if not exists likes (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  target_user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (user_id, target_user_id)
);

-- Passes table.  Records when one user skips another.  Unique constraint
-- prevents duplicate passes.
create table if not exists passes (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  target_user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (user_id, target_user_id)
);

-- Matches table.  A match is created when two users like each other.
create table if not exists matches (
  id bigserial primary key,
  user1_id uuid not null references profiles(id) on delete cascade,
  user2_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (user1_id, user2_id),
  check (user1_id <> user2_id)
);

-- Messages table.  Stores chat messages between matched users.  Deletes are
-- cascaded when a match is removed.
create table if not exists messages (
  id bigserial primary key,
  match_id bigint not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Subscriptions table.  Stores Stripe subscription metadata for each user.
create table if not exists subscriptions (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (stripe_subscription_id)
);

-- Premium usage table.  Tracks how many times a user has used a premium
-- feature on a given day (e.g. rewinds).  The unique constraint ensures
-- that each user/date/feature combination exists at most once.
create table if not exists premium_usage (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('rewind')),
  used_at date not null,
  count integer not null default 0,
  unique (user_id, type, used_at)
);

-- Verification requests table.  Users can request verification; an admin
-- can approve or reject these requests.  Approved requests set the
-- corresponding profile's is_verified flag.
create table if not exists verification_requests (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone
);

-- Events table.  Used for capturing analytics such as likes, passes, matches,
-- etc.  Additional event types can be logged by the application.
create table if not exists events (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  event_name text not null,
  target_id uuid,
  created_at timestamp with time zone default now()
);

-- Stored procedure: use_rewind_if_available
-- Increments the user's rewind usage for the current day if available and
-- returns true.  If the user has no rewinds left, returns false.
create or replace function use_rewind_if_available(p_user_id uuid) returns boolean
language plpgsql
as $$
declare
  today date := current_date;
  usage_count integer;
begin
  select count into usage_count
  from premium_usage
  where user_id = p_user_id
    and type = 'rewind'
    and used_at = today;

  if usage_count >= 1 then
    return false;
  end if;

  insert into premium_usage (user_id, type, used_at, count)
  values (p_user_id, 'rewind', today, 1)
  on conflict (user_id, type, used_at)
  do update set count = premium_usage.count + 1;

  return true;
end;
$$;

-- Stored procedure: can_send_message
-- Returns true if the user has sent fewer than 20 messages in the last 10
-- minutes.  Otherwise returns false.
create or replace function can_send_message(p_user_id uuid) returns boolean
language plpgsql
as $$
declare
  msg_count integer;
begin
  select count(*) into msg_count
  from messages
  where sender_id = p_user_id
    and created_at > now() - interval '10 minutes';

  if msg_count >= 20 then
    return false;
  end if;
  return true;
end;
$$;

-- Stored procedure: get_next_profiles
-- Returns a set of profiles that the user has not yet liked or passed and
-- that are within the specified age range and distance.  The distance is
-- calculated using the PostGIS ST_DWithin function on the geography points.
create or replace function get_next_profiles(
  p_user_id uuid,
  p_limit int default 10
)
returns setof profiles
language sql
as $$
  -- Fetch the requesting user's preferences and location
  with me as (
    select distance_preference, min_age, max_age, location
    from profiles
    where id = p_user_id
  )
  select p.*
  from profiles p, me
  where p.id <> p_user_id
    and p.onboarded = true
    and not exists (
      select 1 from likes l where l.user_id = p_user_id and l.target_user_id = p.id
    )
    and not exists (
      select 1 from passes s where s.user_id = p_user_id and s.target_user_id = p.id
    )
    -- distance filter; ignore if either profile has no location
    and (
      p.location is null or me.location is null or
      ST_DWithin(p.location, me.location, me.distance_preference * 1000)
    )
    -- age range filter; ignore if birthdate is null
    and (
      p.birthdate is null or
      (extract(year from age(p.birthdate)) between me.min_age and me.max_age)
    )
  order by p.created_at desc
  limit p_limit;
$$;

-- Row-level security (RLS) policies

-- Profiles: anyone can read other profiles but cannot see sensitive fields.
alter table profiles enable row level security;
create policy "profiles_select" on profiles
  for select using (true);
create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Likes table policies
alter table likes enable row level security;
create policy "likes_select" on likes for select using (auth.uid() = user_id or auth.uid() = target_user_id);
create policy "likes_insert" on likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on likes for delete using (auth.uid() = user_id);

-- Passes table policies
alter table passes enable row level security;
create policy "passes_select" on passes for select using (auth.uid() = user_id);
create policy "passes_insert" on passes for insert with check (auth.uid() = user_id);
create policy "passes_delete" on passes for delete using (auth.uid() = user_id);

-- Matches table policies
alter table matches enable row level security;
create policy "matches_select" on matches for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "matches_insert" on matches for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "matches_delete" on matches for delete using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Messages table policies
alter table messages enable row level security;
create policy "messages_select" on messages for select using (
  exists (
    select 1 from matches m
    where m.id = messages.match_id
      and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
  )
);
create policy "messages_insert" on messages for insert with check (
  exists (
    select 1 from matches m
    where m.id = messages.match_id
      and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
  )
);

-- Subscriptions table policies
alter table subscriptions enable row level security;
create policy "subscriptions_select" on subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions_insert" on subscriptions for insert with check (auth.uid() = user_id);
create policy "subscriptions_update" on subscriptions for update using (auth.uid() = user_id);

-- Premium usage table policies
alter table premium_usage enable row level security;
create policy "premium_usage_select" on premium_usage for select using (auth.uid() = user_id);
create policy "premium_usage_insert" on premium_usage for insert with check (auth.uid() = user_id);

-- Verification requests table policies
alter table verification_requests enable row level security;
create policy "verification_requests_select" on verification_requests for select using (auth.uid() = user_id);
create policy "verification_requests_insert" on verification_requests for insert with check (auth.uid() = user_id);

-- Events table policies
alter table events enable row level security;
create policy "events_select" on events for select using (auth.uid() = user_id);
create policy "events_insert" on events for insert with check (auth.uid() = user_id);