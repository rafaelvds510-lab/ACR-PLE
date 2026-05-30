-- Tabela principal de escritos (não confundir com 'documents' que são PDFs da Biblioteca)
CREATE TABLE public.writings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Documento sem título',
  content jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb,
  template text NOT NULL DEFAULT 'essay',
  word_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.writings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own writings"   ON public.writings FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own writings" ON public.writings FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own writings" ON public.writings FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own writings" ON public.writings FOR DELETE  USING (auth.uid() = user_id);

-- Histórico de versões
CREATE TABLE public.writing_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  writing_id uuid REFERENCES public.writings(id) ON DELETE CASCADE NOT NULL,
  content jsonb NOT NULL,
  label text DEFAULT 'Auto-save',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.writing_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their writings"
  ON public.writing_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.writings w WHERE w.id = writing_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can insert versions of their writings"
  ON public.writing_versions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.writings w WHERE w.id = writing_id AND w.user_id = auth.uid()));
