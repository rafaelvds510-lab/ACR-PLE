import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AgendaClient from './AgendaClient';
import styles from './agenda.module.css';

export const metadata = {
  title: 'Agenda de Estudos | Acrópole',
  description: 'Organize suas sessões de estudo, revisão e metas semanais.',
};

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch initial events to populate the calendar (optional server-side optimization)
  // For now, we will fetch mostly on the client to allow easy state management with fullcalendar
  
  return (
    <div className={styles.agendaContainer}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Agenda de Estudos</h1>
          <p className={styles.subtitle}>Organize seu tempo e alcance suas metas semanais.</p>
        </div>
      </header>

      <div className={styles.content}>
        <AgendaClient userId={user.id} />
      </div>
    </div>
  );
}
