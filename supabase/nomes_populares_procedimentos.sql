-- =====================================================================
-- Renomeia procedimentos: nome POPULAR primeiro, técnico entre parênteses.
-- Supabase → SQL Editor → New query → cole → Run.
-- (Pode editar qualquer texto antes de rodar.)
-- =====================================================================

update public.procedimentos set nome = 'Atendimento para pé diabético'
  where nome = 'Atendimento pé diabético';

-- Calo/cravo
update public.procedimentos set nome = 'Calo/cravo no pé — raspagem local + lixamento (desbaste plantar)'
  where nome = 'Calo/cravo plantar — desbaste (local) + lixamento';
update public.procedimentos set nome = 'Calo/cravo no pé — raspagem + laser (desbaste plantar)'
  where nome = 'Calo/cravo plantar — desbaste + laser';
update public.procedimentos set nome = 'Calo/cravo no pé — raspagem + lixamento + parafina (desbaste plantar)'
  where nome = 'Calo/cravo plantar — desbaste + lixamento + parafina';

-- Calosidade / calcanhares
update public.procedimentos set nome = 'Raspagem de calosidade — só calcanhares + lixamento (desbaste plantar)'
  where nome = 'Desbaste plantar (só calcanhares) + lixamento';
update public.procedimentos set nome = 'Raspagem de calosidade + lixamento + hidratação (desbaste plantar)'
  where nome = 'Desbaste plantar + lixamento + hidratação';

-- Unha encravada (espiculectomia)
update public.procedimentos set nome = 'Unha encravada inflamada — 1 lado (espiculectomia)'
  where nome = 'Espiculectomia com inflamação — 1 lateral';
update public.procedimentos set nome = 'Unha encravada inflamada — 2 lados (espiculectomia)'
  where nome = 'Espiculectomia com inflamação — 2 laterais';
update public.procedimentos set nome = 'Unha encravada inflamada — 3 ou + lados (espiculectomia)'
  where nome = 'Espiculectomia com inflamação — 3 ou + laterais';
update public.procedimentos set nome = 'Unha encravada sem inflamação — 1 lado (espiculectomia)'
  where nome = 'Espiculectomia sem inflamação — 1 lateral';
update public.procedimentos set nome = 'Unha encravada sem inflamação — 2 lados (espiculectomia)'
  where nome = 'Espiculectomia sem inflamação — 2 laterais';
update public.procedimentos set nome = 'Unha encravada sem inflamação — 3 ou + lados (espiculectomia)'
  where nome = 'Espiculectomia sem inflamação — 3 ou + laterais';

-- Micose de unha (onicomicose) — hálux = dedão
update public.procedimentos set nome = 'Micose de unha — laser — 1 dedão (onicomicose)'
  where nome = 'Onicomicose — laser — 1 hálux';
update public.procedimentos set nome = 'Micose de unha — laser — 2 dedões (onicomicose)'
  where nome = 'Onicomicose — laser — 2 hálux';
update public.procedimentos set nome = 'Micose de unha — ozônio — 1 dedão (onicomicose)'
  where nome = 'Onicomicose — ozonioterapia — 1 hálux';
update public.procedimentos set nome = 'Micose de unha — ozônio — 2 dedões (onicomicose)'
  where nome = 'Onicomicose — ozonioterapia — 2 hálux';

-- Correção de unha encravada (onicoortese)
update public.procedimentos set nome = 'Correção de unha encravada — FMM — 1 dedão (onicoortese)'
  where nome = 'Onicoortese FMM — 1 hálux';
update public.procedimentos set nome = 'Correção de unha encravada — FMM — 2 dedões (onicoortese)'
  where nome = 'Onicoortese FMM — 2 hálux';
update public.procedimentos set nome = 'Correção de unha encravada — Onyfix — 1 dedão (onicoortese)'
  where nome = 'Onicoortese Onyfix — 1 hálux';
update public.procedimentos set nome = 'Correção de unha encravada — Onyfix — 2 dedões (onicoortese)'
  where nome = 'Onicoortese Onyfix — 2 hálux';
update public.procedimentos set nome = 'Correção de unha encravada — resina — 1 dedão (onicoortese)'
  where nome = 'Onicoortese resina — 1 hálux';
update public.procedimentos set nome = 'Correção de unha encravada — resina — 2 dedões (onicoortese)'
  where nome = 'Onicoortese resina — 2 hálux';

-- Limpeza dos pés (podoprofilaxia)
update public.procedimentos set nome = 'Limpeza completa dos pés (podoprofilaxia)'
  where nome = 'Podoprofilaxia';
update public.procedimentos set nome = 'Limpeza completa dos pés + raspagem de calo (podoprofilaxia + desbaste plantar)'
  where nome = 'Podoprofilaxia + desbaste plantar';
update public.procedimentos set nome = 'Limpeza completa dos pés + lixamento das unhas (podoprofilaxia + desbaste ungueal)'
  where nome = 'Podoprofilaxia + desbaste ungueal';

-- Verruga no pé / olho de peixe (verruga plantar)
update public.procedimentos set nome = 'Verruga no pé / olho de peixe — raspagem + jato de plasma (verruga plantar)'
  where nome = 'Verruga plantar — desbaste + jato de plasma';
update public.procedimentos set nome = 'Verruga no pé / olho de peixe — raspagem + laser (verruga plantar)'
  where nome = 'Verruga plantar — desbaste + laser';
