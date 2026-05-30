export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const { card_id, quality } = json; // quality: 1 (Hard/Incorrect), 2 (Good), 3 (Easy)

  if (!card_id || typeof quality !== 'number' || quality < 1 || quality > 3) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // 1. Fetch current card
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('*, decks!inner(user_id)')
    .eq('id', card_id)
    .eq('decks.user_id', user.id)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
  }

  // 2. SM-2 Algorithm Calculation
  const qMap: Record<number, number> = { 1: 2, 2: 4, 3: 5 }; // Map 1-3 to SM-2's 0-5 scale
  const q = qMap[quality];
  
  let newEfactor = card.e_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEfactor < 1.3) newEfactor = 1.3;

  let newInterval = 1;
  let newReps = card.reps;

  if (quality === 1) {
    // Failed or Hard: Reset
    newInterval = 1;
    newReps = 0;
  } else {
    // Good or Easy
    newReps += 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(card.interval * card.e_factor);
    }
    
    // If easy, give a slight interval boost
    if (quality === 3) {
      newInterval = Math.round(newInterval * 1.3);
    }
  }

  // Calculate next_review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  // 3. Update Card
  const { data: updatedCard, error: updateError } = await supabase
    .from('cards')
    .update({
      e_factor: newEfactor,
      interval: newInterval,
      reps: newReps,
      next_review: nextReviewDate.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', card_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 4. Log Review
  await supabase.from('review_logs').insert([
    {
      card_id,
      user_id: user.id,
      quality,
      previous_interval: card.interval
    }
  ]);

  return NextResponse.json(updatedCard);
}
