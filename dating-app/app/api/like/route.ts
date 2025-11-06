import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Not authenticated', { status: 401 });
  }
  const body = await request.json();
  const targetUserId: string | undefined = body.targetUserId;
  if (!targetUserId) {
    return new NextResponse('Missing targetUserId', { status: 400 });
  }
  if (targetUserId === user.id) {
    return new NextResponse('Cannot like yourself', { status: 400 });
  }
  // Insert like
  await supabaseAdmin.from('likes').insert({ user_id: user.id, target_user_id: targetUserId }).onConflict('user_id,target_user_id').ignore();
  // Check reciprocal
  const { data: reciprocal } = await supabaseAdmin
    .from('likes')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('target_user_id', user.id)
    .maybeSingle();
  let isMatch = false;
  if (reciprocal) {
    // Create match if not exists
    await supabaseAdmin
      .from('matches')
      .insert({ user1_id: user.id, user2_id: targetUserId })
      .onConflict('user1_id,user2_id')
      .ignore();
    isMatch = true;
  }
  return NextResponse.json({ match: isMatch });
}