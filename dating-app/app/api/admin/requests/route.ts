import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') ?? [];
  if (!adminEmails.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  // Fetch verification requests and join with profile names
  const { data, error } = await supabaseAdmin
    .from('verification_requests')
    .select('id, user_id, status, created_at, reviewed_at, profiles(full_name, username)')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ requests: data });
}