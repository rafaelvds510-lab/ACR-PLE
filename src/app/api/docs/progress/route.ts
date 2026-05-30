export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, currentPage } = await request.json();

    if (!documentId || currentPage === undefined) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // 1. Get current progress to calculate delta
    const { data: doc } = await supabase
      .from('documents')
      .select('current_page')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    const previousPage = doc?.current_page || 0;
    const delta = currentPage - previousPage;

    // 2. Update document current_page
    await supabase
      .from('documents')
      .update({ current_page: currentPage, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .eq('user_id', user.id);

    // 3. If they advanced, log pages read
    if (delta > 0) {
      await supabase
        .from('reading_logs')
        .insert([
          {
            user_id: user.id,
            document_id: documentId,
            pages_read: delta,
            read_at: new Date().toISOString()
          }
        ]);
    }

    return NextResponse.json({ success: true, delta });

  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
