import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

import type { SupabaseClient } from '@supabase/supabase-js';

// Create a Supabase server client using the auth helpers.  This allows us to
// retrieve the currently authenticated user in server components and API
// routes.  Do not use on the client.
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};

export type ServerSupabaseClient = ReturnType<typeof createServerSupabaseClient>;