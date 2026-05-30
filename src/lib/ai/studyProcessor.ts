import { GeminiAgent } from './geminiClient';

export interface StudyMetadata {
  title: string;
  summary: string;
  tags: string[];
  related_slugs: string[];
  slug: string;
}

const SYSTEM_PROMPT = `Você é um processador de conhecimento acadêmico. 
Ao receber um texto bruto de estudo, você SEMPRE retorna um JSON puro e válido (sem markdown, sem blocos de código) com esta estrutura exata:
{
  "title": "Título limpo e objetivo do estudo",
  "summary": "Resumo executivo em até 3 frases diretas.",
  "tags": ["tag1", "tag2", "tag3"],
  "slug": "titulo-em-formato-slug-sem-acentos",
  "related_slugs": []
}
Regras:
- title: máximo 80 caracteres, capitalizado
- summary: máximo 300 caracteres, em português
- tags: entre 3 e 7 palavras-chave relevantes, em minúsculas e sem acentos
- slug: somente letras minúsculas, números e hífens, sem acentos, máximo 60 chars
- related_slugs: sempre array vazio [] — será preenchido pelo sistema depois
- Nunca adicione texto fora do JSON`;

function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function findRelatedSlugs(newTags: string[], existingSlugs: { slug: string; tags: string[] }[]): string[] {
  if (!existingSlugs.length) return [];

  const related = existingSlugs
    .map(item => {
      const overlap = item.tags.filter(t => newTags.includes(t)).length;
      return { slug: item.slug, overlap };
    })
    .filter(item => item.overlap >= 1)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 5)
    .map(item => item.slug);

  return related;
}

export async function processStudyContent(
  rawText: string,
  existingStudies: { slug: string; tags: string[] }[] = []
): Promise<StudyMetadata> {
  const agent = new GeminiAgent(SYSTEM_PROMPT, 'gemini-1.5-flash');
  agent.initChat();

  const prompt = `Processe este texto de estudo e retorne apenas o JSON:\n\n${rawText.slice(0, 8000)}`;
  const raw = await agent.sendMessage(prompt);

  let parsed: StudyMetadata;
  try {
    // Strip any accidental markdown fencing
    const clean = raw.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    // Fallback: extract JSON from response
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('IA não retornou JSON válido.');
    parsed = JSON.parse(match[0]);
  }

  // Ensure slug is safe
  if (!parsed.slug || parsed.slug.trim() === '') {
    parsed.slug = sanitizeSlug(parsed.title);
  } else {
    parsed.slug = sanitizeSlug(parsed.slug);
  }

  // Build organic connections
  parsed.related_slugs = findRelatedSlugs(parsed.tags, existingStudies);

  return parsed;
}
