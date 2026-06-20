-- =====================================================================
-- Ajuste de procedimentos (rode SÓ se você JÁ tinha adicionado os 27
-- pelo botão e quer corrigir as durações + incluir os novos serviços).
-- Se a lista ainda estiver vazia, NÃO use isto: basta tocar o botão no app.
-- Supabase → SQL Editor → New query → cole → Run.
-- =====================================================================

-- Duração padrão de 90 min, exceto espiculectomia (que já está certa).
update public.procedimentos
   set duracao_min = 90, updated_at = now()
 where nome not ilike 'Espiculectomia%';

-- Novos serviços (só insere os que ainda não existem, evita duplicar).
insert into public.procedimentos (clinica_id, nome, preco, duracao_min)
select c.id, v.nome, v.preco, v.dur
  from public.clinicas c
  cross join (values
    ('Atendimento pé diabético', 140, 90),
    ('Hidratação / SPA dos pés (avulso)', 120, 90),
    ('Retorno pós-procedimento (1º — cortesia)', 0, 30),
    ('Curativo pós-procedimento (a partir do 2º retorno)', 30, 30)
  ) as v(nome, preco, dur)
 where not exists (
   select 1 from public.procedimentos p
    where p.clinica_id = c.id and p.nome = v.nome
 );
