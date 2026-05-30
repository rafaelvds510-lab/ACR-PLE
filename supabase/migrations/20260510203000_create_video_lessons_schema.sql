-- Tabela para sessões de estudo em vídeo
CREATE TABLE public.video_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url text NOT NULL,
  title text,
  category text,
  last_position float DEFAULT 0,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela para anotações vinculadas aos vídeos
CREATE TABLE public.video_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.video_sessions(id) ON DELETE CASCADE NOT NULL,
  timestamp integer NOT NULL, -- em segundos
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own video sessions"
  ON public.video_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage notes for their sessions"
  ON public.video_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.video_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
