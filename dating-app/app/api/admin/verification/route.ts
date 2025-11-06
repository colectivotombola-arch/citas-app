import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Not authenticated', { status: 401 });
  }
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') ?? [];
  if (!adminEmails.includes(user.email ?? '')) {
    return new NextResponse('Not authorized', { status: 403 });
  }
  const { requestId, status } = await request.json();
  if (!requestId || !['approved', 'rejected'].includes(status)) {
    return new NextResponse('Invalid payload', { status: 400 });
  }
  // Update verification request
  const { data: req, error } = await supabaseAdmin
    .from('verification_requests')
    .update({ status, reviewed_at: new Date() })
    .eq('id', requestId)
    .select('user_id')
    .maybeSingle();
  if (error || !req) {
    return new NextResponse('Request not found', { status: 404 });
  }
  // Update profile is_verified
  if (status === 'approved') {
    await supabaseAdmin.from('profiles').update({ is_verified: true }).eq('id', req.user_id);
  } else {
    await supabaseAdmin.from('profiles').update({ is_verified: false }).eq('id', req.user_id);
  }
  return NextResponse.json({ success: true });
}