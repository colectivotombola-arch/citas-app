import { createClient } from '@supabase/supabase-js';

// This file creates a Supabase client with service role access.  It MUST only
// be used on the server.  Never expose the service role key to the client.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export default supabaseAdmin;