export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { events } = await request.json();

  if (!events || !Array.isArray(events)) {
    return NextResponse.json({ error: 'Invalid events data' }, { status: 400 });
  }

  try {
    // 1. Inserir múltiplos eventos
    const eventsToInsert = events.map(e => ({
      user_id: user.id,
      title: e.title,
      type: e.type,
      start_time: e.start_time,
      end_time: e.end_time,
      is_all_day: e.is_all_day || false,
      color: e.color,
      text_color: e.text_color,
      plan_id: e.plan_id,
      plan_name: e.plan_name
    }));

    const { data: insertedEvents, error: insertError } = await supabase
      .from('study_events')
      .insert(eventsToInsert)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 2. Inserir notas para cada evento se existirem
    // Mapeamos os eventos inseridos de volta para suas notas originais
    const notesToInsert = [];
    for (let i = 0; i < insertedEvents.length; i++) {
      if (events[i].notes_html) {
        notesToInsert.push({
          event_id: insertedEvents[i].id,
          content_html: events[i].notes_html
        });
      }
    }

    if (notesToInsert.length > 0) {
      const { error: notesError } = await supabase
        .from('event_notes')
        .insert(notesToInsert);
        
      if (notesError) {
        console.error('Error inserting bulk notes:', notesError);
        // Não falhamos a requisição inteira se apenas as notas falharem, mas logamos
      }
    }

    return NextResponse.json({ success: true, count: insertedEvents.length });
  } catch (error: any) {
    console.error('Bulk insert error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
