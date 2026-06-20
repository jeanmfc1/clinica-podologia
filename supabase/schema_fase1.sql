-- =====================================================================
-- Fase 1 — Pacientes, Procedimentos, Agenda e Prontuário
-- Rode DEPOIS do schema_fase0.sql.
-- Supabase → SQL Editor → New query → cole tudo → Run.
-- Pode rodar mais de uma vez sem problema (é idempotente).
-- =====================================================================

-- Atalhos de segurança usados nas políticas:
--   public.minha_clinica_id()  -> a clínica do usuário logado (criada na Fase 0)
--   auth.uid()                 -> o id do usuário logado

-- ---------------------------------------------------------------------
-- PACIENTES
-- ---------------------------------------------------------------------
create table if not exists public.pacientes (
  id          uuid primary key default gen_random_uuid(),
  clinica_id  uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  nome        text not null,
  telefone    text,
  email       text,
  nascimento  date,
  documento   text,
  endereco    text,
  observacoes text,
  foto_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists pacientes_clinica_idx on public.pacientes (clinica_id);
create index if not exists pacientes_nome_idx on public.pacientes (clinica_id, nome);

-- ---------------------------------------------------------------------
-- PROCEDIMENTOS (catálogo de serviços)
-- ---------------------------------------------------------------------
create table if not exists public.procedimentos (
  id          uuid primary key default gen_random_uuid(),
  clinica_id  uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  nome        text not null,
  preco       numeric(10,2) not null default 0,
  duracao_min integer not null default 30,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists procedimentos_clinica_idx on public.procedimentos (clinica_id);

-- ---------------------------------------------------------------------
-- AGENDAMENTOS
-- ---------------------------------------------------------------------
create table if not exists public.agendamentos (
  id             uuid primary key default gen_random_uuid(),
  clinica_id     uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  paciente_id    uuid references public.pacientes(id) on delete set null,
  procedimento_id uuid references public.procedimentos(id) on delete set null,
  profissional_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  inicio         timestamptz not null,
  fim            timestamptz not null,
  status         text not null default 'agendado'
                 check (status in ('agendado','confirmado','atendido','faltou','cancelado')),
  observacao     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists agendamentos_clinica_inicio_idx on public.agendamentos (clinica_id, inicio);

-- ---------------------------------------------------------------------
-- BLOQUEIOS DE AGENDA (feriados, almoço, folgas)
-- ---------------------------------------------------------------------
create table if not exists public.bloqueios_agenda (
  id          uuid primary key default gen_random_uuid(),
  clinica_id  uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  inicio      timestamptz not null,
  fim         timestamptz not null,
  motivo      text,
  created_at  timestamptz not null default now()
);
create index if not exists bloqueios_clinica_inicio_idx on public.bloqueios_agenda (clinica_id, inicio);

-- ---------------------------------------------------------------------
-- ANAMNESE (uma por paciente; respostas em JSON, flexível)
-- ---------------------------------------------------------------------
create table if not exists public.anamneses (
  id            uuid primary key default gen_random_uuid(),
  clinica_id    uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  paciente_id   uuid not null unique references public.pacientes(id) on delete cascade,
  respostas_json jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
create index if not exists anamneses_clinica_idx on public.anamneses (clinica_id);

-- ---------------------------------------------------------------------
-- ATENDIMENTOS (evolução)
-- ---------------------------------------------------------------------
create table if not exists public.atendimentos (
  id             uuid primary key default gen_random_uuid(),
  clinica_id     uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  paciente_id    uuid not null references public.pacientes(id) on delete cascade,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  profissional_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  data           timestamptz not null default now(),
  evolucao       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists atendimentos_paciente_idx on public.atendimentos (paciente_id, data);

-- ---------------------------------------------------------------------
-- MAPA PODOLÓGICO (achados por pé/região, ligados a um atendimento)
-- ---------------------------------------------------------------------
create table if not exists public.mapa_podologico (
  id            uuid primary key default gen_random_uuid(),
  clinica_id    uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  atendimento_id uuid not null references public.atendimentos(id) on delete cascade,
  pe            text not null check (pe in ('D','E')),
  regiao        text not null,
  achado        text not null,
  observacao    text,
  created_at    timestamptz not null default now()
);
create index if not exists mapa_atendimento_idx on public.mapa_podologico (atendimento_id);

-- ---------------------------------------------------------------------
-- FOTOS CLÍNICAS (antes/depois, com consentimento)
-- ---------------------------------------------------------------------
create table if not exists public.fotos_clinicas (
  id             uuid primary key default gen_random_uuid(),
  clinica_id     uuid not null default public.minha_clinica_id() references public.clinicas(id) on delete cascade,
  atendimento_id uuid not null references public.atendimentos(id) on delete cascade,
  storage_path   text not null,
  momento        text not null default 'antes' check (momento in ('antes','depois')),
  consentimento_em timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists fotos_atendimento_idx on public.fotos_clinicas (atendimento_id);

-- =====================================================================
-- RLS — cada usuário só acessa dados da própria clínica.
-- Para cada tabela: liga RLS e cria 1 política "tudo" (ALL).
-- =====================================================================
do $$
declare
  t text;
  tabelas text[] := array[
    'pacientes','procedimentos','agendamentos','bloqueios_agenda',
    'anamneses','atendimentos','mapa_podologico','fotos_clinicas'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_all', t);
    execute format(
      'create policy %I on public.%I for all
         using (clinica_id = public.minha_clinica_id())
         with check (clinica_id = public.minha_clinica_id());',
      t || '_all', t
    );
  end loop;
end $$;

-- =====================================================================
-- STORAGE — bucket privado para fotos clínicas.
-- Caminho dos arquivos: <clinica_id>/<atendimento_id>/<arquivo>
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('clinicos', 'clinicos', false)
on conflict (id) do nothing;

-- Acesso aos arquivos: só da própria clínica (1ª pasta do caminho = clinica_id).
drop policy if exists clinicos_rw on storage.objects;
create policy clinicos_rw on storage.objects
  for all
  using (
    bucket_id = 'clinicos'
    and (storage.foldername(name))[1] = public.minha_clinica_id()::text
  )
  with check (
    bucket_id = 'clinicos'
    and (storage.foldername(name))[1] = public.minha_clinica_id()::text
  );
