-- =====================================================================
-- Fase 0 — Base de autenticação e segurança (RLS)
-- Cole este script no Supabase: painel → SQL Editor → New query → Run.
-- =====================================================================

-- Para gerar UUIDs.
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tabela: clinicas
-- ---------------------------------------------------------------------
create table if not exists public.clinicas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null default 'Minha Clínica',
  contato     text,
  whatsapp    text,
  horario_json jsonb,
  logo_url    text,
  cor_tema    text default '#0f766e',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Tabela: usuarios (perfil ligado ao Supabase Auth)
-- id é o mesmo do auth.users (auth.uid()).
-- ---------------------------------------------------------------------
create table if not exists public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  clinica_id  uuid not null references public.clinicas(id) on delete cascade,
  nome        text,
  papel       text not null default 'profissional',
  foto_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists usuarios_clinica_id_idx on public.usuarios (clinica_id);

-- ---------------------------------------------------------------------
-- Função utilitária: clínica do usuário logado.
-- Usada nas políticas RLS de todas as tabelas (agora e nas próximas fases).
-- SECURITY DEFINER evita recursão de RLS ao consultar a própria tabela.
-- ---------------------------------------------------------------------
create or replace function public.minha_clinica_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinica_id from public.usuarios where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- Trigger: ao criar um usuário no Auth, cria automaticamente uma clínica
-- e o perfil em public.usuarios. (Perfeito para o cenário de 1 profissional.)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_clinica uuid;
begin
  insert into public.clinicas (nome)
  values (coalesce(new.raw_user_meta_data->>'clinica_nome', 'Minha Clínica'))
  returning id into nova_clinica;

  insert into public.usuarios (id, clinica_id, nome, papel)
  values (
    new.id,
    nova_clinica,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    'profissional'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- RLS — cada usuário só enxerga/edita os dados da própria clínica.
-- ---------------------------------------------------------------------
alter table public.clinicas enable row level security;
alter table public.usuarios enable row level security;

-- clinicas: ver/editar apenas a própria clínica.
drop policy if exists clinicas_select on public.clinicas;
create policy clinicas_select on public.clinicas
  for select using (id = public.minha_clinica_id());

drop policy if exists clinicas_update on public.clinicas;
create policy clinicas_update on public.clinicas
  for update using (id = public.minha_clinica_id());

-- usuarios: ver/editar apenas perfis da própria clínica.
drop policy if exists usuarios_select on public.usuarios;
create policy usuarios_select on public.usuarios
  for select using (clinica_id = public.minha_clinica_id());

drop policy if exists usuarios_update on public.usuarios;
create policy usuarios_update on public.usuarios
  for update using (clinica_id = public.minha_clinica_id());

-- Observação: as inserções em clinicas/usuarios são feitas pelo trigger
-- (security definer), então não há política de INSERT pública — proposital.
