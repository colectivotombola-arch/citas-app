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
    return new NextResponse('Cannot pass yourself', { status: 400 });
  }
  await supabaseAdmin.from('passes').insert({ user_id: user.id, target_user_id: targetUserId }).onConflict('user_id,target_user_id').ignore();
  return NextResponse.json({ success: true });
}