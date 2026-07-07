-- =====================================================================
-- Vários procedimentos por consulta.
-- Uma consulta (agendamento) pode ter mais de um procedimento. Guardamos
-- nome/preço/duração como "foto" do momento, pra o histórico não mudar se
-- o procedimento for editado depois.
-- Supabase → SQL Editor → cole → Run. (Idempotente.)
-- =====================================================================

create table if not exists public.agendamento_procedimentos (
  id             uuid primary key default gen_random_uuid(),
  clinica_id     uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  agendamento_id uuid not null references public.agendamentos(id) on delete cascade,
  procedimento_id uuid references public.procedimentos(id) on delete set null,
  nome           text not null,
  preco          numeric(10,2) not null default 0,
  duracao_min    integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists agend_proc_agend_idx
  on public.agendamento_procedimentos (agendamento_id);

alter table public.agendamento_procedimentos enable row level security;
drop policy if exists agend_proc_all on public.agendamento_procedimentos;
create policy agend_proc_all on public.agendamento_procedimentos for all
  using (clinica_id = public.minha_clinica_id())
  with check (clinica_id = public.minha_clinica_id());

-- Backfill: leva o procedimento único das consultas antigas pra tabela nova.
insert into public.agendamento_procedimentos (clinica_id, agendamento_id, procedimento_id, nome, preco, duracao_min)
select a.clinica_id, a.id, a.procedimento_id, p.nome, p.preco, p.duracao_min
from public.agendamentos a
join public.procedimentos p on p.id = a.procedimento_id
where a.procedimento_id is not null
  and not exists (
    select 1 from public.agendamento_procedimentos ap where ap.agendamento_id = a.id
  );
