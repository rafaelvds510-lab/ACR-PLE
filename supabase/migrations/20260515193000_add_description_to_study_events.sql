-- Adiciona coluna description na tabela study_events
alter table public.study_events
  add column if not exists description text;
