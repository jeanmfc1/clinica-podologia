import type { ItemEstoqueInput } from '../../lib/types'

// Inventário inicial da Pés de Anjo (informado pela Simeire).
// Itens em caixa/pacote são contados na unidade granular (ex.: lâminas por
// unidade, não por caixa) pra a baixa por atendimento funcionar direito.
// Os mínimos são um chute razoável — dá pra editar cada item depois.
export const INVENTARIO_INICIAL: ItemEstoqueInput[] = [
  // Por LOTE (líquidos/cremes — conta usos por frasco). quantidade = reserva.
  // Cada um já está "em uso": o seed abre 1 frasco pra começar a contar.
  { nome: 'Desidratador de unhas', categoria: 'Órteses', tipo: 'lote', unidade: 'ml', tamanho_lote: 10, quantidade: 0, minimo: 0 },
  { nome: 'Cola AlmaSuper', categoria: 'Órteses', tipo: 'lote', unidade: 'g', tamanho_lote: 20, quantidade: 0, minimo: 0 },
  { nome: 'Azul de metileno', categoria: 'Antissépticos', tipo: 'lote', unidade: 'g', tamanho_lote: 60, quantidade: 0, minimo: 0 },
  { nome: 'Creme fármaco (curativo)', categoria: 'Curativos', tipo: 'lote', unidade: 'g', tamanho_lote: 30, quantidade: 0, minimo: 0 },
  { nome: 'Free Calos (amaciante/cutícula)', categoria: 'Cremes e loções', tipo: 'lote', unidade: 'ml', tamanho_lote: 500, quantidade: 0, minimo: 0 },
  { nome: 'Álcool 70%', categoria: 'Limpeza', tipo: 'lote', unidade: 'ml', tamanho_lote: 1000, quantidade: 0, minimo: 0 },
  // Órtese FlexNail — 3 tiras por pacote (cores diferentes), usadas por cm.
  // Cada tira tem 30 cm; no atendimento você digita quantos cm cortou.
  { nome: 'Órtese FlexNail — tira azul (30 cm)', categoria: 'Órteses', unidade: 'cm', quantidade: 30, minimo: 5 },
  { nome: 'Órtese FlexNail — tira amarela (30 cm)', categoria: 'Órteses', unidade: 'cm', quantidade: 30, minimo: 5 },
  { nome: 'Órtese FlexNail — tira vermelha (30 cm)', categoria: 'Órteses', unidade: 'cm', quantidade: 30, minimo: 5 },
  { nome: 'Lixa laminar', categoria: 'Lixas', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Lixa plantar', categoria: 'Lixas', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Bandagem elástica 5×4,5 cm', categoria: 'Curativos', unidade: 'un', quantidade: 6, minimo: 2 },
  { nome: 'Gaze Biotextil 13 fios', categoria: 'Curativos', unidade: 'un', quantidade: 500, minimo: 50 },
  { nome: 'Touca descartável', categoria: 'Descartáveis', unidade: 'un', quantidade: 150, minimo: 30 },
  { nome: 'Máscara NTFlex', categoria: 'Descartáveis', unidade: 'un', quantidade: 25, minimo: 10 },
  { nome: 'Luvas látex PP (Inoven, com pó)', categoria: 'Descartáveis', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Lâmina de bisturi nº 15 (Maxicor)', categoria: 'Lâminas', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Lâmina de bisturi nº 21 (Embramac)', categoria: 'Lâminas', unidade: 'un', quantidade: 100, minimo: 20 },
  { nome: 'Lâmina de bisturi nº 22 (Embramac)', categoria: 'Lâminas', unidade: 'un', quantidade: 100, minimo: 20 },
]
