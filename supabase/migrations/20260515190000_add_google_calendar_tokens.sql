-- Adiciona colunas de integração Google Calendar no perfil do usuário
-- e coluna google_event_id nos eventos de estudo

alter table public.profiles
  add column if not exists google_calendar_access_token text,
  add column if not exists google_calendar_refresh_token text,
  add column if not exists google_calendar_token_expiry bigint;

alter table public.study_events
  add column if not exists google_event_id text;
