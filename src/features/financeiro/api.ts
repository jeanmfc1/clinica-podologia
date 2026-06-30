import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type {
  FormaPagamento,
  Pagamento,
  PagamentoComPaciente,
  PagamentoInput,
} from '../../lib/types'

const CHAVE = 'pagamentos'
const SELECT = '*, paciente:pacientes(nome)'

export const FORMAS: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'credito', rotulo: 'Cartão de crédito' },
  { valor: 'debito', rotulo: 'Cartão de débito' },
  { valor: 'outro', rotulo: 'Outro' },
]

export function rotuloForma(f: FormaPagamento): string {
  return FORMAS.find((x) => x.valor === f)?.rotulo ?? f
}

// Pagamentos num intervalo (ISO/UTC), mais recentes primeiro.
export function usePagamentosIntervalo(iniISO: string, fimISO: string) {
  return useQuery({
    queryKey: [CHAVE, 'intervalo', iniISO, fimISO],
    queryFn: async (): Promise<PagamentoComPaciente[]> => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select(SELECT)
        .gte('data', iniISO)
        .lt('data', fimISO)
        .order('data', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as PagamentoComPaciente[]
    },
  })
}

export function usePagamento(id: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, id],
    enabled: !!id,
    queryFn: async (): Promise<Pagamento> => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCriarPagamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PagamentoInput) => {
      const { error } = await supabase.from('pagamentos').insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useAtualizarPagamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; input: PagamentoInput }) => {
      const { error } = await supabase
        .from('pagamentos')
        .update(args.input)
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useExcluirPagamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pagamentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}
