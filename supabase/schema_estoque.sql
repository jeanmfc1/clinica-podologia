-- =====================================================================
-- Estoque: materiais da clínica (lâminas, cremes, etc.) com quantidade
-- atual e nível mínimo (pra avisar quando estiver acabando).
-- Supabase → SQL Editor → New query → cole → Run.
-- (Pode rodar de novo sem problema — é idempotente.)
-- =====================================================================

create table if not exists public.estoque (
  id          uuid primary key default gen_random_uuid(),
  clinica_id  uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  nome        text not null,
  categoria   text,
  unidade     text not null default 'un',        -- un, cx, ml, par…
  quantidade  numeric(10,2) not null default 0,  -- quanto tem agora
  minimo      numeric(10,2) not null default 0,  -- alerta quando quantidade <= minimo
  observacao  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists estoque_clinica_nome_idx on public.estoque (clinica_id, nome);

-- RLS: cada clínica só vê o seu.
alter table public.estoque enable row level security;
drop policy if exists estoque_all on public.estoque;
create policy estoque_all on public.estoque for all
  using (clinica_id = public.minha_clinica_id())
  with check (clinica_id = public.minha_clinica_id());

-- ---------------------------------------------------------------------
-- Materiais usados em cada atendimento (baixa do estoque acontece no app).
-- Guarda nome/unidade como "foto" do momento, pra continuar legível mesmo
-- se o item for removido do estoque depois.
-- ---------------------------------------------------------------------
create table if not exists public.atendimento_materiais (
  id             uuid primary key default gen_random_uuid(),
  clinica_id     uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  atendimento_id uuid not null references public.atendimentos(id) on delete cascade,
  estoque_id     uuid references public.estoque(id) on delete set null,
  nome           text not null,
  unidade        text not null default 'un',
  quantidade     numeric(10,2) not null default 1,
  created_at     timestamptz not null default now()
);

create index if not exists atend_materiais_atend_idx
  on public.atendimento_materiais (atendimento_id);

alter table public.atendimento_materiais enable row level security;
drop policy if exists atend_materiais_all on public.atendimento_materiais;
create policy atend_materiais_all on public.atendimento_materiais for all
  using (clinica_id = public.minha_clinica_id())
  with check (clinica_id = public.minha_clinica_id());
