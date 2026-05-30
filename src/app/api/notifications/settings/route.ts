export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || {
    push_notifications_enabled: false,
    daily_summary_email_enabled: false,
    weekly_report_enabled: false,
    reading_progress_enabled: false,
    summary_email_time: '08:00:00'
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const { 
    push_notifications_enabled, 
    daily_summary_email_enabled, 
    weekly_report_enabled,
    reading_progress_enabled,
    summary_email_time 
  } = json;

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      push_notifications_enabled,
      daily_summary_email_enabled,
      weekly_report_enabled,
      reading_progress_enabled,
      summary_email_time,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
