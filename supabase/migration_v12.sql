-- Migração v12: estado "Não instalado" (tentativa falhada, precisa de remarcar)
-- Executar no SQL editor do projeto Supabase

alter table public.jobs drop constraint jobs_estado_check;
alter table public.jobs add constraint jobs_estado_check
  check (estado in ('agendado', 'instalado', 'nao_instalado', 'cancelado'));

alter table public.jobs add column motivo_nao_instalado text;
