-- =====================================================================
-- Financeiro: entradas e saídas (com categoria, fiado e data pra receber).
-- Supabase → SQL Editor → New query → cole → Run.
-- (Pode rodar de novo sem problema — é idempotente.)
-- =====================================================================

create table if not exists public.pagamentos (
  id             uuid primary key default gen_random_uuid(),
  clinica_id     uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  paciente_id    uuid references public.pacientes(id) on delete set null,
  tipo           text not null default 'entrada' check (tipo in ('entrada','saida')),
  categoria      text,
  descricao      text,
  valor          numeric(10,2) not null,
  forma          text not null default 'dinheiro'
                 check (forma in ('dinheiro','pix','credito','debito','outro')),
  status         text not null default 'pago' check (status in ('pago','pendente')),
  vencimento     date,
  data           timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- Colunas novas (caso a tabela já existisse de uma versão anterior).
alter table public.pagamentos add column if not exists tipo text not null default 'entrada';
alter table public.pagamentos add column if not exists categoria text;
alter table public.pagamentos add column if not exists status text not null default 'pago';
alter table public.pagamentos add column if not exists vencimento date;

create index if not exists pagamentos_clinica_data_idx on public.pagamentos (clinica_id, data);
create index if not exists pagamentos_status_idx on public.pagamentos (clinica_id, status);

-- RLS: cada clínica só vê o seu.
alter table public.pagamentos enable row level security;
drop policy if exists pagamentos_all on public.pagamentos;
create policy pagamentos_all on public.pagamentos for all
  using (clinica_id = public.minha_clinica_id())
  with check (clinica_id = public.minha_clinica_id());
