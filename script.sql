create policy "Users can delete debate rooms." on public.debate_rooms for delete using (auth.uid() = creator_id);
create policy "Users can create forum categories." on public.forum_categories for insert with check (true);
