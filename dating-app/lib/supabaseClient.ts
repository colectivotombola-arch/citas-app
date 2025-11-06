import { createClient } from '@supabase/supabase-js';

// Create a browser/client-side Supabase client.  This should only be used on the
// client and references the anon public key.  On the server, use
// supabaseAdmin.ts instead.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Export a singleton client so it is reused between component renders.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;