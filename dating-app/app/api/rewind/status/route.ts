import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ rewindsAvailable: 0 });
  }
  // Check if the user has an active subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .neq('status', 'canceled')
    .maybeSingle();
  if (!sub) {
    // No active subscription: no rewinds available
    return NextResponse.json({ rewindsAvailable: 0 });
  }
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('premium_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('type', 'rewind')
    .eq('used_at', today)
    .maybeSingle();
  const used = data?.count ?? 0;
  const left = 1 - used;
  return NextResponse.json({ rewindsAvailable: left > 0 ? left : 0 });
}