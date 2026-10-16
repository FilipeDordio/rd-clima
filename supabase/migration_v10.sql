-- Migração v10: Histórico do trabalho (registo automático de alterações de estado)
-- Executar no SQL editor do projeto Supabase

create table public.job_historico (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  autor_id uuid references public.profiles (id) on delete set null,
  evento text not null check (evento in ('criado', 'estado_alterado', 'editado')),
  estado_anterior text,
  estado_novo text,
  created_at timestamptz not null default now()
);

create index job_historico_job_id_idx on public.job_historico (job_id);

alter table public.job_historico enable row level security;

create policy "Admins veem todo o historico"
  on public.job_historico for select
  using (public.is_admin());

create policy "Tecnicos veem o historico dos seus trabalhos"
  on public.job_historico for select
  using (
    exists (
      select 1 from public.job_tecnicos jt
      where jt.job_id = job_historico.job_id and jt.tecnico_id = auth.uid()
    )
  );

-- Regista automaticamente criação e alterações de estado dos trabalhos.
-- security definer: garante que o registo acontece independentemente de quem
-- (admin ou técnico) fez a alteração, sem precisar de policy de insert.
create function public.log_job_historico()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.job_historico (job_id, autor_id, evento, estado_novo)
    values (new.id, auth.uid(), 'criado', new.estado);
  elsif tg_op = 'UPDATE' then
    if new.estado is distinct from old.estado then
      insert into public.job_historico (job_id, autor_id, evento, estado_anterior, estado_novo)
      values (new.id, auth.uid(), 'estado_alterado', old.estado, new.estado);
    else
      insert into public.job_historico (job_id, autor_id, evento, estado_anterior, estado_novo)
      values (new.id, auth.uid(), 'editado', old.estado, new.estado);
    end if;
  end if;
  return new;
end;
$$;

create trigger jobs_log_historico
  after insert or update on public.jobs
  for each row execute procedure public.log_job_historico();
