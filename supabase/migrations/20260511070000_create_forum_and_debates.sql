-- Migration: Create Forum and Debates Schema
-- Date: 2026-05-11

-- 1. Forum Categories (Disciplinas)
create table public.forum_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  icon_name text, -- Reference to AcropoleIcons
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Forum Threads
create table public.forum_threads (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.forum_categories(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null, -- Markdown supported
  is_pinned boolean default false,
  is_locked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Forum Posts (Replies)
create table public.forum_posts (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.forum_threads(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete cascade not null,
  parent_id uuid references public.forum_posts(id) on delete cascade, -- For nested replies
  content text not null, -- Markdown supported
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Debate Rooms
create table public.debate_rooms (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category_id uuid references public.forum_categories(id) on delete set null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  status text check (status in ('open', 'closed', 'archived')) default 'open',
  is_ai_enabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Debate Arguments
create table public.debate_arguments (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.debate_rooms(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete cascade not null,
  side text check (side in ('pro', 'contra', 'neutral')) not null,
  content text not null,
  document_id uuid references public.documents(id) on delete set null, -- Link to Library
  document_page integer, -- Citation page
  document_quote text, -- The quoted text from PDF
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Votes (Polymorphic-like structure for Posts and Arguments)
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  post_id uuid references public.forum_posts(id) on delete cascade,
  argument_id uuid references public.debate_arguments(id) on delete cascade,
  vote_type integer check (vote_type in (1, -1)), -- 1 for upvote, -1 for downvote
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id),
  unique(user_id, argument_id),
  check (
    (post_id is not null and argument_id is null) or
    (post_id is null and argument_id is not null)
  )
);

-- RLS (Row Level Security)
alter table public.forum_categories enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.debate_rooms enable row level security;
alter table public.debate_arguments enable row level security;
alter table public.votes enable row level security;

-- Policies (Simplified for visibility, usually split by role)
create policy "Forum Categories are viewable by everyone." on public.forum_categories for select using (true);

create policy "Users can view all threads." on public.forum_threads for select using (true);
create policy "Users can create threads." on public.forum_threads for insert with check (auth.uid() = author_id);
create policy "Users can update their own threads." on public.forum_threads for update using (auth.uid() = author_id);

create policy "Users can view all posts." on public.forum_posts for select using (true);
create policy "Users can create posts." on public.forum_posts for insert with check (auth.uid() = author_id);

create policy "Users can view all debate rooms." on public.debate_rooms for select using (true);
create policy "Users can create debate rooms." on public.debate_rooms for insert with check (auth.uid() = creator_id);

create policy "Users can view all arguments." on public.debate_arguments for select using (true);
create policy "Users can create arguments." on public.debate_arguments for insert with check (auth.uid() = author_id);

create policy "Users can view all votes." on public.votes for select using (true);
create policy "Users can vote." on public.votes for insert with check (auth.uid() = user_id);
create policy "Users can change their vote." on public.votes for update using (auth.uid() = user_id);
