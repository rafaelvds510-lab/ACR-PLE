-- Create the documents table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  file_path text not null,
  size_bytes bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for documents table
alter table public.documents enable row level security;

create policy "Users can view their own documents."
  on public.documents for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own documents."
  on public.documents for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own documents."
  on public.documents for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own documents."
  on public.documents for delete
  using ( auth.uid() = user_id );

-- Insert the storage bucket "library"
insert into storage.buckets (id, name, public)
values ('library', 'library', false)
on conflict (id) do nothing;

-- RLS for storage.objects
create policy "Users can upload their own PDFs."
  on storage.objects for insert
  with check (
    bucket_id = 'library' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own PDFs."
  on storage.objects for select
  using (
    bucket_id = 'library'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own PDFs."
  on storage.objects for update
  using (
    bucket_id = 'library'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own PDFs."
  on storage.objects for delete
  using (
    bucket_id = 'library'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
