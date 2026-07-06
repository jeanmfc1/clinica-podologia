-- =====================================================================
-- Estoque: materiais da clínica (lâminas, cremes, etc.) com quantidade
-- atual e nível mínimo (pra avisar quando estiver acabando).
-- Supabase → SQL Editor → New query → cole → Run.
-- (Pode rodar de novo sem problema — é idempotente.)
-- =====================================================================

create table if not exists public.estoque (
  id           uuid primary key default gen_random_uuid(),
  clinica_id   uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  nome         text not null,
  categoria    text,
  unidade      text not null default 'un',        -- un, cx, ml, par…
  quantidade   numeric(10,2) not null default 0,  -- 'unidade': quanto tem; 'lote': frascos de reserva
  minimo       numeric(10,2) not null default 0,  -- alerta quando quantidade <= minimo
  -- 'unidade' = conta por unidade (baixa 1 por uso).
  -- 'lote'    = liquido/creme: conta usos por frasco aberto (ver estoque_lotes).
  tipo         text not null default 'unidade',
  tamanho_lote numeric(10,2),                      -- tamanho de cada frasco (ml/g), pra media por uso
  preco        numeric(10,2) not null default 0,   -- preco de VENDA (0 = nao vende, so material)
  observacao   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Colunas novas (caso a tabela já existisse de uma versão anterior).
alter table public.estoque add column if not exists tipo text not null default 'unidade';
alter table public.estoque add column if not exists tamanho_lote numeric(10,2);
alter table public.estoque add column if not exists preco numeric(10,2) not null default 0;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'estoque_tipo_chk') then
    alter table public.estoque add constraint estoque_tipo_chk check (tipo in ('unidade','lote'));
  end if;
end $$;

create index if not exists estoque_clinica_nome_idx on public.estoque (clinica_id, nome);

-- RLS: cada clínica só vê o seu.
alter table public.estoque enable row level security;
drop policy if exists estoque_all on public.estoque;
create policy estoque_all on public.estoque for all
  using (clinica_id = public.minha_clinica_id())
  with check (clinica_id = public.minha_clinica_id());

-- ---------------------------------------------------------------------
-- Lotes (frascos) dos itens 'lote': cada frasco aberto conta quantos usos
-- teve. Quando fecha, dá pra ver quanto durou e a média por uso.
-- ---------------------------------------------------------------------
create table if not exists public.estoque_lotes (
  id          uuid primary key default gen_random_uuid(),
  clinica_id  uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  estoque_id  uuid not null references public.estoque(id) on delete cascade,
  rotulo      text,                               -- número/nome do lote (opcional)
  tamanho     numeric(10,2),                      -- tamanho do frasco (ml/g), opcional
  usos        numeric(10,2) not null default 0,   -- soma dos usos registrados
  aberto_em   timestamptz not null default now(),
  fechado_em  timestamptz,                        -- null = ainda aberto (em uso)
  created_at  timestamptz not null default now()
);

create index if not exists estoque_lotes_item_idx
  on public.estoque_lotes (estoque_id, aberto_em);

alter table public.estoque_lotes enable row level security;
drop policy if exists estoque_lotes_all on public.estoque_lotes;
create policy estoque_lotes_all on public.estoque_lotes for all
  using (clinica_id = public.minha_clinica_id())
  with check (clinica_id = public.minha_clinica_id());

-- ---------------------------------------------------------------------
-- Materiais usados em cada atendimento (baixa do estoque acontece no app).
-- Guarda nome/unidade como "foto" do momento, pra continuar legível mesmo
-- se o item for removido do estoque depois. Para itens 'lote', quantidade
-- = número de usos e lote_id aponta o frasco que recebeu os usos.
-- ---------------------------------------------------------------------
create table if not exists public.atendimento_materiais (
  id             uuid primary key default gen_random_uuid(),
  clinica_id     uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  atendimento_id uuid not null references public.atendimentos(id) on delete cascade,
  estoque_id     uuid references public.estoque(id) on delete set null,
  lote_id        uuid references public.estoque_lotes(id) on delete set null,
  nome           text not null,
  unidade        text not null default 'un',
  quantidade     numeric(10,2) not null default 1,
  created_at     timestamptz not null default now()
);

-- Coluna nova (caso a tabela já existisse de uma versão anterior).
alter table public.atendimento_materiais
  add column if not exists lote_id uuid references public.estoque_lotes(id) on delete set null;

create index if not exists atend_materiais_atend_idx
  on public.atendimento_materiais (atendimento_id);

alter table public.atendimento_materiais enable row level security;
drop policy if exists atend_materiais_all on public.atendimento_materiais;
create policy atend_materiais_all on public.atendimento_materiais for all
  using (clinica_id = public.minha_clinica_id())
  with check (clinica_id = public.minha_clinica_id());
