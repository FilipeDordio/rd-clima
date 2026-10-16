-- Migração v7: AC multi-split (várias unidades exteriores, 1 interior)
-- Executar no SQL editor do projeto Supabase

alter table public.jobs
  add column multi boolean not null default false,
  add column unidades_exteriores int;
