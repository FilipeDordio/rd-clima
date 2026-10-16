-- Migração v6: gestão de clientes + ligação cliente-trabalho
-- Executar no SQL editor do projeto Supabase

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  morada text not null,
  localidade text,
  dimensoes text,
  tipo_operacao text check (tipo_operacao in ('instalacao', 'desinstalacao', 'ambos')),
  created_at timestamptz not null default now()
);

create index clientes_nome_idx on public.clientes (nome);

alter table public.clientes enable row level security;

create policy "Admins gerem clientes"
  on public.clientes for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Utilizadores autenticados veem clientes"
  on public.clientes for select
  using (auth.role() = 'authenticated');

alter table public.jobs
  add column cliente_id uuid references public.clientes (id) on delete set null;

create index jobs_cliente_id_idx on public.jobs (cliente_id);
