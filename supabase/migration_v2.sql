-- Migração v2: tipos de serviço, hora agendada, descrição
-- Executar no SQL editor do projeto Supabase (base de dados já criada)

alter table public.jobs
  add column tipo_servico text not null default 'ar_condicionado'
    check (tipo_servico in ('ar_condicionado', 'bomba_calor', 'solar_termico', 'hidraulica')),
  add column descricao text,
  add column hora_agendada time,
  alter column tipo_ac drop not null;
