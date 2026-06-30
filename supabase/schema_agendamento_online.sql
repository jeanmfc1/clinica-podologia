-- =====================================================================
-- Agendamento online: marca de onde veio a consulta.
-- Supabase → SQL Editor → New query → cole → Run.
-- =====================================================================

-- 'manual' = marcada pela clínica no app; 'online' = pedida pelo paciente.
alter table public.agendamentos
  add column if not exists origem text not null default 'manual';
