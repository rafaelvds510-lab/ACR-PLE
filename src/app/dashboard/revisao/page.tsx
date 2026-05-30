import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RevisaoClient from './RevisaoClient';
import styles from './revisao.module.css';

export const metadata = {
  title: 'Revisão Espaçada (SRS) | Acrópole',
  description: 'Revise seus flashcards usando o algoritmo SM-2.',
};

export default async function RevisaoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Revisão (SRS)</h1>
          <p className={styles.subtitle}>Retenção de memória baseada em repetição espaçada.</p>
        </div>
      </header>
      <div className={styles.content}>
        <RevisaoClient userId={user.id} />
      </div>
    </div>
  );
}
