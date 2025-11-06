"use client";

import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useState } from 'react';
import supabase from '@/lib/supabaseClient';

// A simple provider component to wrap the app and provide a Supabase session
// context.  This ensures that user sessions are persisted across route
// transitions on the client.
export default function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => supabase);
  return <SessionContextProvider supabaseClient={supabaseClient}>{children}</SessionContextProvider>;
}