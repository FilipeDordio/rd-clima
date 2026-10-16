-- Migração v13: catálogo de modelos de equipamento, geríveis pelo admin
-- Executar no SQL editor do projeto Supabase

create table public.modelos_equipamento (
  id uuid primary key default gen_random_uuid(),
  tipo_servico text not null check (tipo_servico in ('ar_condicionado', 'bomba_calor', 'solar_termico')),
  nome text not null,
  created_at timestamptz not null default now()
);

create index modelos_equipamento_tipo_servico_idx on public.modelos_equipamento (tipo_servico);

alter table public.modelos_equipamento enable row level security;

create policy "Admins gerem modelos de equipamento"
  on public.modelos_equipamento for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Utilizadores autenticados veem modelos de equipamento"
  on public.modelos_equipamento for select
  using (auth.role() = 'authenticated');

-- Semente com os BTUs que já existiam fixos no código, para a lista não
-- aparecer vazia da primeira vez.
insert into public.modelos_equipamento (tipo_servico, nome) values
  ('ar_condicionado', '9000 BTU'),
  ('ar_condicionado', '12000 BTU'),
  ('ar_condicionado', '18000 BTU'),
  ('ar_condicionado', '24000 BTU'),
  ('ar_condicionado', '36000 BTU');
