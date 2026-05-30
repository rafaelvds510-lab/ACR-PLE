import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MapasClient from './MapasClient';
import styles from './mapas.module.css';

export const metadata = {
  title: 'Mapas Mentais | Acrópole',
  description: 'Organize seu conhecimento visualmente com mapas mentais.',
};

export default async function MapasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className={styles.container}>
      <MapasClient />
    </div>
  );
}
