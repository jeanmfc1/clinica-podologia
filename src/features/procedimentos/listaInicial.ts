import type { ProcedimentoInput } from '../../lib/types'

// Lista inicial de procedimentos da Pés de Anjo (preços da Simeire).
// As durações são estimativas iniciais — a Simeire pode ajustar cada uma no app.
export const LISTA_INICIAL: ProcedimentoInput[] = [
  { nome: 'Avaliação (consulta inicial)', preco: 60, duracao_min: 30 },

  { nome: 'Podoprofilaxia', preco: 130, duracao_min: 60 },
  { nome: 'Podoprofilaxia + desbaste ungueal', preco: 140, duracao_min: 60 },
  { nome: 'Podoprofilaxia + desbaste plantar', preco: 200, duracao_min: 75 },

  { nome: 'Espiculectomia com inflamação — 1 lateral', preco: 130, duracao_min: 40 },
  { nome: 'Espiculectomia com inflamação — 2 laterais', preco: 140, duracao_min: 45 },
  { nome: 'Espiculectomia com inflamação — 3 ou + laterais', preco: 150, duracao_min: 50 },

  { nome: 'Espiculectomia sem inflamação — 1 lateral', preco: 100, duracao_min: 40 },
  { nome: 'Espiculectomia sem inflamação — 2 laterais', preco: 120, duracao_min: 45 },
  { nome: 'Espiculectomia sem inflamação — 3 ou + laterais', preco: 130, duracao_min: 50 },

  { nome: 'Onicoortese FMM — 1 hálux', preco: 80, duracao_min: 40 },
  { nome: 'Onicoortese FMM — 2 hálux', preco: 130, duracao_min: 50 },
  { nome: 'Onicoortese Onyfix — 1 hálux', preco: 150, duracao_min: 40 },
  { nome: 'Onicoortese Onyfix — 2 hálux', preco: 220, duracao_min: 50 },
  { nome: 'Onicoortese resina — 1 hálux', preco: 130, duracao_min: 40 },
  { nome: 'Onicoortese resina — 2 hálux', preco: 200, duracao_min: 50 },

  { nome: 'Desbaste plantar + lixamento + hidratação', preco: 150, duracao_min: 50 },
  { nome: 'Desbaste plantar (só calcanhares) + lixamento', preco: 120, duracao_min: 40 },

  { nome: 'Calo/cravo plantar — desbaste + laser', preco: 120, duracao_min: 40 },
  { nome: 'Calo/cravo plantar — desbaste (local) + lixamento', preco: 100, duracao_min: 40 },
  { nome: 'Calo/cravo plantar — desbaste + lixamento + parafina', preco: 220, duracao_min: 60 },

  { nome: 'Verruga plantar — desbaste + laser', preco: 120, duracao_min: 40 },
  { nome: 'Verruga plantar — desbaste + jato de plasma', preco: 100, duracao_min: 40 },

  { nome: 'Onicomicose — laser — 1 hálux', preco: 100, duracao_min: 30 },
  { nome: 'Onicomicose — laser — 2 hálux', preco: 200, duracao_min: 40 },
  { nome: 'Onicomicose — ozonioterapia — 1 hálux', preco: 70, duracao_min: 30 },
  { nome: 'Onicomicose — ozonioterapia — 2 hálux', preco: 150, duracao_min: 40 },
]
