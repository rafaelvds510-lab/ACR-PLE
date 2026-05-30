-- Create study_events table
CREATE TABLE public.study_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('reading', 'flashcards', 'video', 'debate', 'writing', 'other')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_all_day boolean DEFAULT false,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for study_events
ALTER TABLE public.study_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study events" 
  ON public.study_events FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study events" 
  ON public.study_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study events" 
  ON public.study_events FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study events" 
  ON public.study_events FOR DELETE 
  USING (auth.uid() = user_id);

-- Create event_notes table
CREATE TABLE public.event_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.study_events(id) ON DELETE CASCADE NOT NULL,
  content_html text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for event_notes
ALTER TABLE public.event_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes of their events"
  ON public.event_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_events
      WHERE study_events.id = event_notes.event_id
      AND study_events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes for their events"
  ON public.event_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_events
      WHERE study_events.id = event_notes.event_id
      AND study_events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes of their events"
  ON public.event_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.study_events
      WHERE study_events.id = event_notes.event_id
      AND study_events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes of their events"
  ON public.event_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.study_events
      WHERE study_events.id = event_notes.event_id
      AND study_events.user_id = auth.uid()
    )
  );

-- Create weekly_goals table
CREATE TABLE public.weekly_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  target_hours numeric DEFAULT 0,
  target_flashcards integer DEFAULT 0,
  target_pages integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS for weekly_goals
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly goals" 
  ON public.weekly_goals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly goals" 
  ON public.weekly_goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly goals" 
  ON public.weekly_goals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly goals" 
  ON public.weekly_goals FOR DELETE 
  USING (auth.uid() = user_id);

-- Create reminders table
CREATE TABLE public.reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.study_events(id) ON DELETE CASCADE NOT NULL,
  remind_at timestamptz NOT NULL,
  type text NOT NULL CHECK (type IN ('push', 'email')),
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their reminders"
  ON public.reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_events
      WHERE study_events.id = reminders.event_id
      AND study_events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_events
      WHERE study_events.id = reminders.event_id
      AND study_events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their reminders"
  ON public.reminders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.study_events
      WHERE study_events.id = reminders.event_id
      AND study_events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their reminders"
  ON public.reminders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.study_events
      WHERE study_events.id = reminders.event_id
      AND study_events.user_id = auth.uid()
    )
  );
