export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current week range (Monday to Sunday)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekStartISO = weekStart.toISOString().split('T')[0];

    // 1. Fetch Targets
    const { data: targetData } = await supabase
      .from('weekly_goals')
      .select('target_hours, target_flashcards, target_pages')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartISO)
      .single();

    const targets = {
      hours: targetData?.target_hours || 10, // Default 10h
      flashcards: targetData?.target_flashcards || 100, // Default 100
      pages: targetData?.target_pages || 50 // Default 50
    };

    // 2. Fetch Progress
    
    // 2a. Hours (from study_events)
    const { data: events } = await supabase
      .from('study_events')
      .select('start_time, end_time')
      .eq('user_id', user.id)
      .gte('start_time', weekStart.toISOString())
      .lt('start_time', weekEnd.toISOString());

    let totalMinutes = 0;
    events?.forEach(event => {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      if (duration > 0) totalMinutes += duration;
    });
    const currentHours = Math.round((totalMinutes / 60) * 10) / 10;

    // 2b. Flashcards (from review_logs)
    const { count: flashcardsCount } = await supabase
      .from('review_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('reviewed_at', weekStart.toISOString())
      .lt('reviewed_at', weekEnd.toISOString());

    // 2c. Pages (from reading_logs)
    const { data: readingLogs } = await supabase
      .from('reading_logs')
      .select('pages_read')
      .eq('user_id', user.id)
      .gte('read_at', weekStart.toISOString())
      .lt('read_at', weekEnd.toISOString());

    const currentPages = readingLogs?.reduce((sum, log) => sum + log.pages_read, 0) || 0;

    return NextResponse.json({
      goals: {
        hours: { current: currentHours, target: targets.hours },
        flashcards: { current: flashcardsCount || 0, target: targets.flashcards },
        pages: { current: currentPages, target: targets.pages }
      }
    });

  } catch (error) {
    console.error('Goals API error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}
