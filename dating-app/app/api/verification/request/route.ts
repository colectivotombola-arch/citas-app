import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Not authenticated', { status: 401 });
  }
  // Try to insert a new verification request; if one already exists, ignore
  await supabaseAdmin
    .from('verification_requests')
    .insert({ user_id: user.id, status: 'pending' })
    .onConflict('user_id')
    .ignore();
  return NextResponse.json({ success: true });
}