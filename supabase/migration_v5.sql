-- Migração v5: permitir atribuir vários técnicos ao mesmo trabalho
-- Executar no SQL editor do projeto Supabase

-- Tabela de associação N-para-N entre trabalhos e técnicos
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

-- Migra as atribuições já existentes (1 técnico por trabalho) para a nova tabela
insert into public.job_tecnicos (job_id, tecnico_id)
select id, tecnico_id from public.jobs where tecnico_id is not null;

-- Substitui as policies de jobs que dependiam da coluna tecnico_id
drop policy "Tecnicos veem os seus trabalhos" on public.jobs;
drop policy "Tecnicos atualizam os seus trabalhos" on public.jobs;

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

-- A coluna tecnico_id deixa de ser necessária na tabela jobs
drop index if exists jobs_tecnico_id_idx;
alter table public.jobs drop column tecnico_id;
