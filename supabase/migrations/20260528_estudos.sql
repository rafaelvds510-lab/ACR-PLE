-- ══════════════════════════════════════════════════
-- BANCO ORGÂNICO DE ESTUDOS — Migration
-- ══════════════════════════════════════════════════

create table if not exists public.estudos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  slug         text not null,
  title        text not null,
  summary      text,
  body         text not null,
  tags         text[] default '{}',
  related_slugs text[] default '{}',
  source_type  text not null default 'text' check (source_type in ('text', 'pdf', 'url')),
  status       text not null default 'published' check (status in ('published', 'draft')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(user_id, slug)
);

-- Índice full-text para busca em português
create index if not exists estudos_fts_idx
  on public.estudos
  using gin(to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(body,'')));

-- Índice por usuário
create index if not exists estudos_user_idx on public.estudos(user_id, created_at desc);

-- Trigger para updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger estudos_updated_at
  before update on public.estudos
  for each row execute procedure public.set_updated_at();

-- ── RLS ──
alter table public.estudos enable row level security;

create policy "Users can view own estudos"
  on public.estudos for select
  using (auth.uid() = user_id);

create policy "Users can insert own estudos"
  on public.estudos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own estudos"
  on public.estudos for update
  using (auth.uid() = user_id);

create policy "Users can delete own estudos"
  on public.estudos for delete
  using (auth.uid() = user_id);
