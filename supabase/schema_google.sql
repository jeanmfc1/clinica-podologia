-- =====================================================================
-- Integração com Google Agenda — tabela de conexão.
-- Supabase → SQL Editor → New query → cole → Run.
-- =====================================================================

create table if not exists public.google_integracao (
  clinica_id       uuid primary key references public.clinicas(id) on delete cascade,
  refresh_token    text,
  access_token     text,
  access_token_exp timestamptz,
  sync_token       text,
  calendar_id      text not null default 'primary',
  email_google     text,
  conectado_em     timestamptz,
  ultimo_sync      timestamptz
);

-- RLS ligado SEM políticas: nenhum cliente (anon/authenticated) acessa esta
-- tabela. Só o backend (service_role) lê/grava os tokens. O app consulta o
-- status pela rota /api/google/status.
alter table public.google_integracao enable row level security;

-- Colunas para a sincronização (ligam cada consulta ao evento do Google).
alter table public.agendamentos add column if not exists google_event_id text;
alter table public.agendamentos add column if not exists google_sync_em timestamptz;
