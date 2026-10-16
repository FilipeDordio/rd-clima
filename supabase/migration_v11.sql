-- Migração v11: tipo de serviço "Manutenção" + Aparelhos instalados
-- Executar no SQL editor do projeto Supabase

-- 1. Novo tipo de serviço "manutencao"
alter table public.jobs drop constraint jobs_tipo_servico_check;
alter table public.jobs add constraint jobs_tipo_servico_check
  check (tipo_servico in (
    'ar_condicionado', 'bomba_calor', 'solar_termico', 'hidraulica', 'pre_instalacao', 'manutencao'
  ));

-- 2. Intenção de próxima manutenção, definida ao criar o trabalho de instalação
-- (ou ao concluir uma manutenção). dia_certo=false significa que só o mês é
-- conhecido — o dia guardado é sempre 1, ignorado na apresentação.
alter table public.jobs
  add column proxima_manutencao date,
  add column proxima_manutencao_dia_certo boolean not null default false;

-- 3. Aparelhos instalados (equipamento físico em casa do cliente)
-- cliente_id fica a null quando o trabalho de instalação não tinha cliente
-- registado — cliente_nome garante que o aparelho fica sempre identificável.
create table public.aparelhos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes (id) on delete set null,
  cliente_nome text not null,
  job_instalacao_id uuid unique references public.jobs (id) on delete set null,
  tipo_servico text not null check (tipo_servico in ('ar_condicionado', 'bomba_calor', 'solar_termico')),
  tipo_ac text,
  morada text not null,
  data_instalacao date,
  data_ultima_manutencao date,
  proxima_manutencao date,
  proxima_manutencao_dia_certo boolean not null default false,
  notas text,
  created_at timestamptz not null default now()
);

create index aparelhos_cliente_id_idx on public.aparelhos (cliente_id);
create index aparelhos_proxima_manutencao_idx on public.aparelhos (proxima_manutencao);

alter table public.aparelhos enable row level security;

create policy "Admins gerem aparelhos"
  on public.aparelhos for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Utilizadores autenticados veem aparelhos"
  on public.aparelhos for select
  using (auth.role() = 'authenticated');

-- 4. Trabalhos de manutenção referem o aparelho que estão a intervencionar
alter table public.jobs
  add column aparelho_id uuid references public.aparelhos (id) on delete set null;

-- 5. Sincronização automática: instalar cria o aparelho, manutenção atualiza-o
create function public.sync_aparelho_instalacao()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.estado = 'instalado'
     and old.estado is distinct from new.estado
     and new.tipo_servico in ('ar_condicionado', 'bomba_calor', 'solar_termico')
  then
    insert into public.aparelhos (
      cliente_id, cliente_nome, job_instalacao_id, tipo_servico, tipo_ac,
      morada, data_instalacao, proxima_manutencao, proxima_manutencao_dia_certo
    )
    values (
      new.cliente_id, new.cliente, new.id, new.tipo_servico, new.tipo_ac,
      new.endereco, new.data_agendada, new.proxima_manutencao, new.proxima_manutencao_dia_certo
    )
    on conflict (job_instalacao_id) do nothing;
  end if;

  if new.estado = 'instalado'
     and old.estado is distinct from new.estado
     and new.tipo_servico = 'manutencao'
     and new.aparelho_id is not null
  then
    update public.aparelhos
    set data_ultima_manutencao = new.data_agendada,
        proxima_manutencao = new.proxima_manutencao,
        proxima_manutencao_dia_certo = new.proxima_manutencao_dia_certo
    where id = new.aparelho_id;
  end if;

  return new;
end;
$$;

create trigger jobs_sync_aparelho
  after update on public.jobs
  for each row execute procedure public.sync_aparelho_instalacao();
