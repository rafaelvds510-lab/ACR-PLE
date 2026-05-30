import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const { title, type, start_time, end_time, is_all_day, notes_html, color, text_color } = json;

  // Only update fields that are provided
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (type !== undefined) updateData.type = type;
  if (start_time !== undefined) updateData.start_time = start_time;
  if (end_time !== undefined) updateData.end_time = end_time;
  if (is_all_day !== undefined) updateData.is_all_day = is_all_day;
  if (color !== undefined) updateData.color = color;
  if (text_color !== undefined) updateData.text_color = text_color;

  const { data: eventData, error: eventError } = await supabase
    .from('study_events')
    .update(updateData)
    .eq('id', params.id)
    .eq('user_id', user.id) // security check
    .select()
    .single();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  if (notes_html !== undefined) {
    // Upsert notes (could also do a check if note exists, then update or insert)
    const { data: existingNote } = await supabase
      .from('event_notes')
      .select('id')
      .eq('event_id', params.id)
      .single();
    
    if (existingNote) {
      await supabase.from('event_notes').update({ content_html: notes_html }).eq('id', existingNote.id);
    } else {
      await supabase.from('event_notes').insert([{ event_id: params.id, content_html: notes_html }]);
    }
  }

  return NextResponse.json(eventData);
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('study_events')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id); // security check

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
