CREATE TABLE public.mindmaps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  state jsonb DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for mindmaps
ALTER TABLE public.mindmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mindmaps" 
  ON public.mindmaps FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mindmaps" 
  ON public.mindmaps FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mindmaps" 
  ON public.mindmaps FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mindmaps" 
  ON public.mindmaps FOR DELETE 
  USING (auth.uid() = user_id);
