import type { ItemEstoqueInput } from '../../lib/types'

// Inventário inicial da Pés de Anjo (informado pela Simeire).
// Itens em caixa/pacote são contados na unidade granular (ex.: lâminas por
// unidade, não por caixa) pra a baixa por atendimento funcionar direito.
// Os mínimos são um chute razoável — dá pra editar cada item depois.
export const INVENTARIO_INICIAL: ItemEstoqueInput[] = [
  { nome: 'Desidratador de unhas', categoria: 'Órteses', unidade: 'ml', quantidade: 10, minimo: 2 },
  { nome: 'Cola AlmaSuper', categoria: 'Órteses', unidade: 'g', quantidade: 20, minimo: 5 },
  { nome: 'Kit órtese ungueal FlexNail (tiras 30 cm)', categoria: 'Órteses', unidade: 'un', quantidade: 3, minimo: 1 },
  { nome: 'Lixa laminar', categoria: 'Lixas', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Lixa plantar', categoria: 'Lixas', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Azul de metileno', categoria: 'Antissépticos', unidade: 'g', quantidade: 60, minimo: 10 },
  { nome: 'Creme fármaco (curativo)', categoria: 'Curativos', unidade: 'g', quantidade: 30, minimo: 5 },
  { nome: 'Bandagem elástica 5×4,5 cm', categoria: 'Curativos', unidade: 'un', quantidade: 6, minimo: 2 },
  { nome: 'Gaze Biotextil 13 fios', categoria: 'Curativos', unidade: 'un', quantidade: 500, minimo: 50 },
  { nome: 'Free Calos (amaciante/cutícula)', categoria: 'Cremes e loções', unidade: 'ml', quantidade: 500, minimo: 100 },
  { nome: 'Touca descartável', categoria: 'Descartáveis', unidade: 'un', quantidade: 150, minimo: 30 },
  { nome: 'Máscara NTFlex', categoria: 'Descartáveis', unidade: 'un', quantidade: 25, minimo: 10 },
  { nome: 'Luvas látex PP (Inoven, com pó)', categoria: 'Descartáveis', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Álcool 70%', categoria: 'Limpeza', unidade: 'ml', quantidade: 1000, minimo: 200 },
  { nome: 'Lâmina de bisturi nº 15 (Maxicor)', categoria: 'Lâminas', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Lâmina de bisturi nº 21 (Embramac)', categoria: 'Lâminas', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Lâmina de bisturi nº 22 (Embramac)', categoria: 'Lâminas', unidade: 'un', quantidade: 100, minimo: 20 },
]
