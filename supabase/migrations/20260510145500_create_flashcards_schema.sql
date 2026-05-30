-- Create decks table
CREATE TABLE public.decks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.decks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for decks
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decks" 
  ON public.decks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks" 
  ON public.decks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks" 
  ON public.decks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks" 
  ON public.decks FOR DELETE 
  USING (auth.uid() = user_id);

-- Create cards table
CREATE TABLE public.cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id uuid REFERENCES public.decks(id) ON DELETE CASCADE NOT NULL,
  front_html text NOT NULL,
  back_html text NOT NULL,
  next_review timestamptz DEFAULT now(),
  interval integer DEFAULT 0,
  e_factor numeric DEFAULT 2.5,
  reps integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards" 
  ON public.cards FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own cards" 
  ON public.cards FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own cards" 
  ON public.cards FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own cards" 
  ON public.cards FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- Create review_logs table
CREATE TABLE public.review_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id uuid REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_at timestamptz DEFAULT now(),
  quality integer NOT NULL CHECK (quality >= 1 AND quality <= 3),
  previous_interval integer
);

-- Enable RLS for review_logs
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own review logs" 
  ON public.review_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review logs" 
  ON public.review_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
