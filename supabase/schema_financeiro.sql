-- =====================================================================
-- Financeiro: pagamentos (entradas) das consultas.
-- Supabase → SQL Editor → New query → cole → Run.
-- =====================================================================

create table if not exists public.pagamentos (
  id             uuid primary key default gen_random_uuid(),
  clinica_id     uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  paciente_id    uuid references public.pacientes(id) on delete set null,
  descricao      text,
  valor          numeric(10,2) not null,
  forma          text not null default 'dinheiro'
                 check (forma in ('dinheiro','pix','credito','debito','outro')),
  data           timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index if not exists pagamentos_clinica_data_idx on public.pagamentos (clinica_id, data);

-- RLS: cada clínica só vê o seu.
alter table public.pagamentos enable row level security;
drop policy if exists pagamentos_all on public.pagamentos;
create policy pagamentos_all on public.pagamentos for all
  using (clinica_id = public.minha_clinica_id())
  with check (clinica_id = public.minha_clinica_id());
