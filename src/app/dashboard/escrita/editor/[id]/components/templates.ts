// Template JSON structures for TipTap
export type TemplateId = 'essay' | 'notebook';

export const TEMPLATES: Record<TemplateId, { label: string; description: string; emoji: string; content: any }> = {
  essay: {
    label: 'Redação',
    emoji: '✍️',
    description: 'Estrutura completa com capítulos, páginas e marcações para redação (ENEM, vestibulares).',
    content: {
      type: 'notebook',
      chapters: [
        {
          id: 'chap-1',
          title: 'Estrutura da Redação',
          pages: [
            {
              id: 'page-1',
              title: 'Introdução',
              content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tese e Argumentos' }] }, { type: 'paragraph', content: [{ type: 'text', text: '' }] }] },
              ink: []
            },
            {
              id: 'page-2',
              title: 'Desenvolvimento',
              content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Argumentação' }] }, { type: 'paragraph', content: [{ type: 'text', text: '' }] }] },
              ink: []
            },
            {
              id: 'page-3',
              title: 'Conclusão',
              content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Proposta de Intervenção' }] }, { type: 'paragraph', content: [{ type: 'text', text: '' }] }] },
              ink: []
            }
          ]
        }
      ]
    },
  },
  notebook: {
    label: 'Caderno de Estudos',
    emoji: '📓',
    description: 'Organize grandes temas com capítulos e páginas estruturadas.',
    content: {
      type: 'notebook',
      chapters: [
        {
          id: 'chap-1',
          title: 'Capítulo 1',
          pages: [
            {
              id: 'page-1',
              title: 'Página 1',
              content: {
                type: 'doc',
                content: [
                  { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Página 1' }] },
                  { type: 'paragraph', content: [{ type: 'text', text: '' }] }
                ]
              },
              ink: []
            }
          ]
        }
      ]
    }
  }
};
