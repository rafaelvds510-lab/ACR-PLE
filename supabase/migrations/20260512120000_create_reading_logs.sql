-- Create reading_logs table to track pages read over time
CREATE TABLE IF NOT EXISTS public.reading_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  pages_read integer NOT NULL,
  read_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reading_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reading logs" 
  ON public.reading_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading logs" 
  ON public.reading_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
