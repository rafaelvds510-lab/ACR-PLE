-- Seed Forum Categories
insert into public.forum_categories (name, slug, description, icon_name)
values 
  ('Filosofia', 'Filosofia', 'Discussões sobre metafísica, ética, lógica e história da filosofia.', 'IconScales'),
  ('História', 'História', 'Debates sobre historiografia, eventos marcantes e análise documental.', 'IconScroll'),
  ('Política', 'Política', 'Teoria política, sistemas de governo e ética pública.', 'IconShield'),
  ('Literatura', 'Literatura', 'Análise literária, hermenêutica e crítica textual.', 'IconPen')
on conflict (slug) do nothing;
