import type { ItemEstoqueInput } from '../../lib/types'

// Produtos que a Simeire vende (por unidade, com preço) + os mesmos em uso no
// atendimento (por lote). Carregados pelo botão "Adicionar produtos de venda".
export const PRODUTOS_INICIAIS: ItemEstoqueInput[] = [
  // À venda (conta por unidade, com preço).
  { nome: 'Creme hidratante OxiOz 120g', categoria: 'Produtos (venda)', unidade: 'un', quantidade: 7, minimo: 1, preco: 90 },
  { nome: 'Óleo de girassol ozonizado 20ml', categoria: 'Produtos (venda)', unidade: 'un', quantidade: 2, minimo: 1, preco: 85 },
  { nome: 'Óleo ozonizado c/ Melaleuca 20ml', categoria: 'Produtos (venda)', unidade: 'un', quantidade: 10, minimo: 2, preco: 90 },
  { nome: 'Esfoliante Cora 250g', categoria: 'Produtos (venda)', unidade: 'un', quantidade: 1, minimo: 1, preco: 35 },
  // Em uso no atendimento (por lote — conta usos por frasco).
  { nome: 'Creme OxiOz (em uso)', categoria: 'Produtos (em uso)', tipo: 'lote', unidade: 'g', tamanho_lote: 120, quantidade: 0, minimo: 0 },
  { nome: 'Óleo c/ Melaleuca (em uso)', categoria: 'Produtos (em uso)', tipo: 'lote', unidade: 'ml', tamanho_lote: 20, quantidade: 0, minimo: 0 },
]
