-- Esquema da base de dados para a app de gestão de instalações de AC
-- Executar no SQL editor do projeto Supabase

-- ============================================================
-- Tabela de perfis (espelha auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  role text not null default 'tecnico' check (role in ('admin', 'tecnico')),
  telefone text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cria automaticamente um perfil quando um novo utilizador se regista
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, role, telefone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'tecnico'),
    new.raw_user_meta_data ->> 'telefone',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Função auxiliar: o utilizador autenticado é admin?
-- security definer para evitar recursão das policies de RLS em profiles
create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Impede que um utilizador normal altere o seu proprio role
create function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Sem permissão para alterar o role.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();

-- Policies: profiles
create policy "Utilizadores veem o seu proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins veem todos os perfis"
  on public.profiles for select
  using (public.is_admin());

create policy "Utilizadores atualizam o seu proprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins atualizam todos os perfis"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- Tabela de clientes
-- ============================================================
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

-- ============================================================
-- Tabela de trabalhos (instalações)
-- ============================================================
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes (id) on delete set null,
  cliente text not null,
  endereco text not null,
  tipo_servico text not null default 'ar_condicionado'
    check (tipo_servico in ('ar_condicionado', 'bomba_calor', 'solar_termico', 'hidraulica', 'pre_instalacao')),
  tipo_ac text,
  multi boolean not null default false,
  unidades_exteriores int,
  pre_instalacao text check (pre_instalacao in ('tem', 'nao_tem', 'nao_se_sabe')),
  descricao text,
  quantidade int not null default 1,
  data_agendada date not null,
  hora_agendada time,
  estado text not null default 'agendado' check (estado in ('agendado', 'instalado', 'cancelado')),
  notas text,
  foto_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_data_agendada_idx on public.jobs (data_agendada);
create index jobs_cliente_id_idx on public.jobs (cliente_id);

alter table public.jobs enable row level security;

-- ============================================================
-- Associação N-para-N entre trabalhos e técnicos atribuídos
-- ============================================================
create table public.job_tecnicos (
  job_id uuid not null references public.jobs (id) on delete cascade,
  tecnico_id uuid not null references public.profiles (id) on delete cascade,
  primary key (job_id, tecnico_id)
);

create index job_tecnicos_tecnico_id_idx on public.job_tecnicos (tecnico_id);

alter table public.job_tecnicos enable row level security;

create policy "Admins gerem as atribuicoes de tecnicos"
  on public.job_tecnicos for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Tecnicos veem as suas atribuicoes"
  on public.job_tecnicos for select
  using (tecnico_id = auth.uid());

-- Atualiza updated_at automaticamente
create function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute procedure public.handle_updated_at();

-- Policies: jobs
create policy "Admins gerem todos os trabalhos"
  on public.jobs for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Tecnicos veem os seus trabalhos"
  on public.jobs for select
  using (
    exists (
      select 1 from public.job_tecnicos jt
      where jt.job_id = id and jt.tecnico_id = auth.uid()
    )
  );

create policy "Tecnicos atualizam os seus trabalhos"
  on public.jobs for update
  using (
    exists (
      select 1 from public.job_tecnicos jt
      where jt.job_id = id and jt.tecnico_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.job_tecnicos jt
      where jt.job_id = id and jt.tecnico_id = auth.uid()
    )
  );

-- ============================================================
-- Storage: fotos das instalações
-- ============================================================
insert into storage.buckets (id, name, public)
values ('instalacoes', 'instalacoes', true)
on conflict (id) do nothing;

create policy "Leitura publica de fotos de instalacoes"
  on storage.objects for select
  using (bucket_id = 'instalacoes');

create policy "Utilizadores autenticados fazem upload de fotos"
  on storage.objects for insert
  with check (bucket_id = 'instalacoes' and auth.role() = 'authenticated');

create policy "Utilizadores autenticados atualizam as suas fotos"
  on storage.objects for update
  using (bucket_id = 'instalacoes' and auth.role() = 'authenticated');

-- ============================================================
-- Storage: fotos de perfil
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy "Leitura publica de avatares"
  on storage.objects for select
  using (bucket_id = 'avatares');

create policy "Utilizadores fazem upload do seu avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Utilizadores atualizam o seu avatar"
  on storage.objects for update
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- Subscrições de Web Push (notificações em tempo real)
-- ============================================================
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Utilizadores gerem as suas subscricoes push"
  on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
