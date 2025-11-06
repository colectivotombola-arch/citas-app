import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Not authenticated', { status: 401 });
  }
  // Call the RPC to consume a rewind if available
  const { data: result, error: rpcError } = await supabaseAdmin.rpc('use_rewind_if_available', { p_user_id: user.id });
  if (rpcError || !result) {
    return NextResponse.json({ success: false, message: 'No tienes rewinds disponibles.' });
  }
  // Determine the most recent swipe (like or pass)
  const { data: lastPass } = await supabaseAdmin
    .from('passes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: lastLike } = await supabaseAdmin
    .from('likes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  let undoneType: 'pass' | 'like' | null = null;
  // Compare timestamps to find the most recent
  if (lastPass && (!lastLike || new Date(lastPass.created_at) > new Date(lastLike.created_at))) {
    // Undo pass
    await supabaseAdmin.from('passes').delete().eq('id', lastPass.id);
    undoneType = 'pass';
  } else if (lastLike) {
    await supabaseAdmin.from('likes').delete().eq('id', lastLike.id);
    // Also delete any match created due to this like
    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${lastLike.target_user_id}`)
      .maybeSingle();
    if (match) {
      await supabaseAdmin.from('matches').delete().eq('id', match.id);
    }
    undoneType = 'like';
  }
  return NextResponse.json({ success: true, undoneType });
}