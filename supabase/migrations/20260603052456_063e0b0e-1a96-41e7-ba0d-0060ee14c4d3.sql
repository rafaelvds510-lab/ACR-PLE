
-- Add 'finished' value to existing enum
ALTER TYPE reading_status ADD VALUE IF NOT EXISTS 'finished';

-- Add new columns to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS current_page integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pages integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fichamento_title text;

-- Highlights table
CREATE TABLE IF NOT EXISTS public.document_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  page integer NOT NULL,
  color text NOT NULL DEFAULT 'yellow',
  text text,
  rects jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_highlights TO authenticated;
GRANT ALL ON public.document_highlights TO service_role;
ALTER TABLE public.document_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "highlights_own" ON public.document_highlights FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_doc ON public.document_highlights(document_id);

-- Sticky notes table
CREATE TABLE IF NOT EXISTS public.document_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  page integer NOT NULL DEFAULT 1,
  x numeric NOT NULL DEFAULT 0,
  y numeric NOT NULL DEFAULT 0,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_notes TO authenticated;
GRANT ALL ON public.document_notes TO service_role;
ALTER TABLE public.document_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_notes_own" ON public.document_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notes_doc ON public.document_notes(document_id);
