import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Procedimento, ProcedimentoInput } from '../../lib/types'

const CHAVE = 'procedimentos'

// Lista de procedimentos. Por padrão traz todos; filtra inativos se pedido.
export function useProcedimentos(somenteAtivos = false) {
  return useQuery({
    queryKey: [CHAVE, { somenteAtivos }],
    queryFn: async (): Promise<Procedimento[]> => {
      let q = supabase.from('procedimentos').select('*').order('nome')
      if (somenteAtivos) q = q.eq('ativo', true)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useProcedimento(id: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, id],
    enabled: !!id,
    queryFn: async (): Promise<Procedimento> => {
      const { data, error } = await supabase
        .from('procedimentos')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCriarProcedimento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProcedimentoInput): Promise<Procedimento> => {
      const { data, error } = await supabase
        .from('procedimentos')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useAtualizarProcedimento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; input: ProcedimentoInput }) => {
      const { error } = await supabase
        .from('procedimentos')
        .update({ ...args.input, updated_at: new Date().toISOString() })
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useExcluirProcedimento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('procedimentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

// Insere vários de uma vez (usado pelo botão "lista inicial").
export function useSeedProcedimentos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (lista: ProcedimentoInput[]) => {
      const { error } = await supabase.from('procedimentos').insert(lista)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}
