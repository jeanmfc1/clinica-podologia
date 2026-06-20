import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type {
  Agendamento,
  AgendamentoComNomes,
  AgendamentoInput,
  StatusAgendamento,
} from '../../lib/types'

const CHAVE = 'agendamentos'
const SELECT = '*, paciente:pacientes(nome), procedimento:procedimentos(nome,preco)'

// Agendamentos de um dia (data local 'AAAA-MM-DD').
export function useAgendamentosDoDia(dataISO: string) {
  return useQuery({
    queryKey: [CHAVE, 'dia', dataISO],
    queryFn: async (): Promise<AgendamentoComNomes[]> => {
      const ini = new Date(`${dataISO}T00:00:00`)
      const fim = new Date(ini)
      fim.setDate(fim.getDate() + 1)
      const { data, error } = await supabase
        .from('agendamentos')
        .select(SELECT)
        .gte('inicio', ini.toISOString())
        .lt('inicio', fim.toISOString())
        .order('inicio')
      if (error) throw error
      return (data ?? []) as unknown as AgendamentoComNomes[]
    },
  })
}

export function useAgendamento(id: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, id],
    enabled: !!id,
    queryFn: async (): Promise<AgendamentoComNomes> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(SELECT)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as AgendamentoComNomes
    },
  })
}

export function useCriarAgendamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AgendamentoInput): Promise<Agendamento> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useAtualizarAgendamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; input: AgendamentoInput }) => {
      const { error } = await supabase
        .from('agendamentos')
        .update({ ...args.input, updated_at: new Date().toISOString() })
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

// Muda só o status (botões rápidos: confirmar, atendido, faltou, cancelar).
export function useMudarStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; status: StatusAgendamento }) => {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: args.status, updated_at: new Date().toISOString() })
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useExcluirAgendamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agendamentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}
