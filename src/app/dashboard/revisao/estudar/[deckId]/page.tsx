import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReviewStudyClient from './ReviewStudyClient';
import styles from './estudar.module.css';

export const metadata = {
  title: 'Estudar Flashcards | Acrópole',
};

export default async function EstudarPage({ params }: { params: { deckId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Next.js 15+ wait for params
  const deckId = await Promise.resolve(params.deckId);

  return (
    <div className={styles.container}>
      <ReviewStudyClient deckId={deckId} />
    </div>
  );
}
