-- Migração v9: Férias e ausências dos técnicos
-- Executar no SQL editor do projeto Supabase

create table public.ausencias (
  id uuid primary key default gen_random_uuid(),
  tecnico_id uuid not null references public.profiles (id) on delete cascade,
  data_inicio date not null,
  data_fim date not null,
  motivo text,
  created_at timestamptz not null default now(),
  constraint ausencias_periodo_valido check (data_fim >= data_inicio)
);

create index ausencias_tecnico_id_idx on public.ausencias (tecnico_id);
create index ausencias_periodo_idx on public.ausencias (data_inicio, data_fim);

alter table public.ausencias enable row level security;

create policy "Admins gerem ausencias"
  on public.ausencias for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Tecnicos veem as suas ausencias"
  on public.ausencias for select
  using (tecnico_id = auth.uid());
