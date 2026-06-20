import type { ProcedimentoInput } from '../../lib/types'

// Lista inicial de procedimentos da Pés de Anjo (preços da Simeire).
// Duração padrão de 90 min, exceto espiculectomia (durações reais).
// A Simeire pode ajustar tudo no app.
export const LISTA_INICIAL: ProcedimentoInput[] = [
  { nome: 'Avaliação (consulta inicial)', preco: 60, duracao_min: 90 },

  { nome: 'Podoprofilaxia', preco: 130, duracao_min: 90 },
  { nome: 'Podoprofilaxia + desbaste ungueal', preco: 140, duracao_min: 90 },
  { nome: 'Podoprofilaxia + desbaste plantar', preco: 200, duracao_min: 90 },

  { nome: 'Espiculectomia com inflamação — 1 lateral', preco: 130, duracao_min: 40 },
  { nome: 'Espiculectomia com inflamação — 2 laterais', preco: 140, duracao_min: 45 },
  { nome: 'Espiculectomia com inflamação — 3 ou + laterais', preco: 150, duracao_min: 50 },

  { nome: 'Espiculectomia sem inflamação — 1 lateral', preco: 100, duracao_min: 40 },
  { nome: 'Espiculectomia sem inflamação — 2 laterais', preco: 120, duracao_min: 45 },
  { nome: 'Espiculectomia sem inflamação — 3 ou + laterais', preco: 130, duracao_min: 50 },

  { nome: 'Onicoortese FMM — 1 hálux', preco: 80, duracao_min: 90 },
  { nome: 'Onicoortese FMM — 2 hálux', preco: 130, duracao_min: 90 },
  { nome: 'Onicoortese Onyfix — 1 hálux', preco: 150, duracao_min: 90 },
  { nome: 'Onicoortese Onyfix — 2 hálux', preco: 220, duracao_min: 90 },
  { nome: 'Onicoortese resina — 1 hálux', preco: 130, duracao_min: 90 },
  { nome: 'Onicoortese resina — 2 hálux', preco: 200, duracao_min: 90 },

  { nome: 'Desbaste plantar + lixamento + hidratação', preco: 150, duracao_min: 90 },
  { nome: 'Desbaste plantar (só calcanhares) + lixamento', preco: 120, duracao_min: 90 },

  { nome: 'Calo/cravo plantar — desbaste + laser', preco: 120, duracao_min: 90 },
  { nome: 'Calo/cravo plantar — desbaste (local) + lixamento', preco: 100, duracao_min: 90 },
  { nome: 'Calo/cravo plantar — desbaste + lixamento + parafina', preco: 220, duracao_min: 90 },

  { nome: 'Verruga plantar — desbaste + laser', preco: 120, duracao_min: 90 },
  { nome: 'Verruga plantar — desbaste + jato de plasma', preco: 100, duracao_min: 90 },

  { nome: 'Onicomicose — laser — 1 hálux', preco: 100, duracao_min: 90 },
  { nome: 'Onicomicose — laser — 2 hálux', preco: 200, duracao_min: 90 },
  { nome: 'Onicomicose — ozonioterapia — 1 hálux', preco: 70, duracao_min: 90 },
  { nome: 'Onicomicose — ozonioterapia — 2 hálux', preco: 150, duracao_min: 90 },

  // Serviços adicionais
  { nome: 'Atendimento pé diabético', preco: 140, duracao_min: 90 },
  { nome: 'Hidratação / SPA dos pés (avulso)', preco: 120, duracao_min: 90 },
  // Retorno: o 1º é cortesia; os seguintes são curativo a R$ 30.
  { nome: 'Retorno pós-procedimento (1º — cortesia)', preco: 0, duracao_min: 30 },
  { nome: 'Curativo pós-procedimento (a partir do 2º retorno)', preco: 30, duracao_min: 30 },
]
