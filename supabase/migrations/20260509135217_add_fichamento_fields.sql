-- Add new fields for URL support, reading progress, and Fichamento
alter table public.documents
  add column type varchar(50) default 'file' not null,
  add column source_url text,
  add column category text,
  add column notes text,
  add column current_page integer default 0 not null,
  add column total_pages integer default 0 not null,
  add column status varchar(50) default 'reading' not null;

-- Make file_path and size_bytes nullable because URL-type documents won't have them
alter table public.documents
  alter column file_path drop not null,
  alter column size_bytes drop not null;
