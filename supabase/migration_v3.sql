-- Migração v3: tipo de serviço "Pré Instalação" + campo pré-instalação para AC
-- Executar no SQL editor do projeto Supabase (base de dados já criada)

alter table public.jobs
  drop constraint if exists jobs_tipo_servico_check;

alter table public.jobs
  add constraint jobs_tipo_servico_check
    check (tipo_servico in ('ar_condicionado', 'bomba_calor', 'solar_termico', 'hidraulica', 'pre_instalacao'));

alter table public.jobs
  add column pre_instalacao text check (pre_instalacao in ('tem', 'nao_tem', 'nao_se_sabe'));
