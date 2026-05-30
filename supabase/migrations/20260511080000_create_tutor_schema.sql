-- Migration: Create Tutor Schema
-- Date: 2026-05-11

-- 1. Tutor Conversations
create table if not exists public.tutor_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  theme text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tutor Messages
create table if not exists public.tutor_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.tutor_conversations(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  level text check (level in ('layman', 'intermediate', 'advanced')),
  is_socratic boolean default false,
  citations jsonb default '[]', -- Array of {docId, page, snippet}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages enable row level security;

-- Políticas
create policy "Users can manage their own conversations."
  on public.tutor_conversations for all
  using (auth.uid() = user_id);

create policy "Users can view messages of their conversations."
  on public.tutor_messages for select
  using (exists (
    select 1 from public.tutor_conversations 
    where id = tutor_messages.conversation_id and user_id = auth.uid()
  ));

create policy "Users can insert messages into their conversations."
  on public.tutor_messages for insert
  with check (exists (
    select 1 from public.tutor_conversations 
    where id = tutor_messages.conversation_id and user_id = auth.uid()
  ));
