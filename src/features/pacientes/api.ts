import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Paciente, PacienteInput } from '../../lib/types'

const CHAVE = 'pacientes'

// Lista de pacientes, com busca opcional por nome.
export function usePacientes(busca: string) {
  return useQuery({
    queryKey: [CHAVE, { busca }],
    queryFn: async (): Promise<Paciente[]> => {
      let q = supabase.from('pacientes').select('*').order('nome')
      if (busca.trim()) {
        q = q.ilike('nome', `%${busca.trim()}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

// Um paciente pelo id.
export function usePaciente(id: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, id],
    enabled: !!id,
    queryFn: async (): Promise<Paciente> => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCriarPaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PacienteInput): Promise<Paciente> => {
      const { data, error } = await supabase
        .from('pacientes')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useAtualizarPaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; input: PacienteInput }): Promise<Paciente> => {
      const { data, error } = await supabase
        .from('pacientes')
        .update({ ...args.input, updated_at: new Date().toISOString() })
        .eq('id', args.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useExcluirPaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('pacientes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}
