import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { ItemEstoque, ItemEstoqueInput } from '../../lib/types'

const CHAVE = 'estoque'

// Sugestões de unidade e categoria (campos livres; isto só ajuda no formulário).
export const UNIDADES = ['un', 'cx', 'par', 'ml', 'g', 'kg', 'm', 'rolo']
export const CATEGORIAS_ESTOQUE = [
  'Lâminas',
  'Cremes e loções',
  'Antissépticos',
  'Curativos',
  'Descartáveis',
  'Instrumentos',
  'Limpeza',
  'Outro',
]

// Um item está acabando quando a quantidade chegou (ou passou) do mínimo.
export function estaFaltando(item: ItemEstoque): boolean {
  return item.minimo > 0 && item.quantidade <= item.minimo
}

// Lista o estoque: itens que estão faltando primeiro, depois por nome.
export function useEstoque() {
  return useQuery({
    queryKey: [CHAVE],
    queryFn: async (): Promise<ItemEstoque[]> => {
      const { data, error } = await supabase.from('estoque').select('*').order('nome')
      if (error) throw error
      const itens = (data ?? []) as ItemEstoque[]
      return itens.sort((a, b) => {
        const fa = estaFaltando(a) ? 0 : 1
        const fb = estaFaltando(b) ? 0 : 1
        return fa - fb || a.nome.localeCompare(b.nome, 'pt-BR')
      })
    },
  })
}

export function useItemEstoque(id: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, id],
    enabled: !!id,
    queryFn: async (): Promise<ItemEstoque> => {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCriarItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ItemEstoqueInput) => {
      const { error } = await supabase.from('estoque').insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useAtualizarItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; input: ItemEstoqueInput }) => {
      const { error } = await supabase
        .from('estoque')
        .update({ ...args.input, updated_at: new Date().toISOString() })
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

// Ajuste rápido da quantidade (botões + / − na lista). Nunca deixa negativo.
export function useAjustarQuantidade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; atual: number; delta: number }) => {
      const nova = Math.max(0, args.atual + args.delta)
      const { error } = await supabase
        .from('estoque')
        .update({ quantidade: nova, updated_at: new Date().toISOString() })
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useExcluirItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('estoque').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}
