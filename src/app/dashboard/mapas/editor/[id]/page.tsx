import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Node, Edge } from '@xyflow/react';
import XMindEditor from './XMindEditorNoSSR';

export const metadata = {
  title: 'Editor de Mapa Mental | Acrópole',
};

export default async function MapEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mapData } = await supabase
    .from('mindmaps')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!mapData) redirect('/dashboard/mapas');

  const state = mapData.state || { nodes: [], edges: [] };
  const initialNodes: Node[] = state.nodes || [];
  const initialEdges: Edge[] = state.edges || [];

  return (
    <XMindEditor
      mapId={id}
      initialTitle={mapData.title}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
    />
  );
}
