import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('study_events')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const { title, type, start_time, end_time, is_all_day, notes_html, color, text_color } = json;

  // 1. Insert Event
  const { data: eventData, error: eventError } = await supabase
    .from('study_events')
    .insert([
      {
        user_id: user.id,
        title,
        type,
        start_time,
        end_time,
        is_all_day,
        color,
        text_color
      }
    ])
    .select()
    .single();

  if (eventError || !eventData) {
    return NextResponse.json({ error: eventError?.message || 'Failed to create event' }, { status: 500 });
  }

  // 2. Insert Notes if any
  if (notes_html) {
    await supabase.from('event_notes').insert([
      { event_id: eventData.id, content_html: notes_html }
    ]);
  }

  return NextResponse.json(eventData);
}
