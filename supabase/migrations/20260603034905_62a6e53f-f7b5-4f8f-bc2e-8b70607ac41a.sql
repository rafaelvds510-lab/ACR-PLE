CREATE TYPE public.reading_status AS ENUM ('unread', 'reading', 'completed');

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Sem título',
  author TEXT,
  category TEXT,
  status public.reading_status NOT NULL DEFAULT 'unread',
  source_type TEXT NOT NULL DEFAULT 'upload', -- 'upload' | 'url'
  file_path TEXT, -- storage path in 'library' bucket
  external_url TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_own ON public.documents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER documents_touch_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage RLS for 'library' bucket (bucket created via tool separately)
CREATE POLICY "library_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "library_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "library_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "library_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);
