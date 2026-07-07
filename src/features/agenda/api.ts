import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { apiGet, apiPost } from '../../lib/apiBackend'
import type {
  Agendamento,
  AgendamentoComNomes,
  AgendamentoInput,
  ItemConsulta,
  StatusAgendamento,
} from '../../lib/types'

const CHAVE = 'agendamentos'
const SELECT =
  '*, paciente:pacientes(nome,telefone), procedimento:procedimentos(nome,preco),' +
  ' itens:agendamento_procedimentos(procedimento_id,nome,preco,duracao_min)'

// Regrava os procedimentos de uma consulta (apaga os antigos e insere os novos).
export async function salvarProcedimentosDaConsulta(
  agendamentoId: string,
  itens: ItemConsulta[],
): Promise<void> {
  await supabase.from('agendamento_procedimentos').delete().eq('agendamento_id', agendamentoId)
  if (itens.length === 0) return
  const linhas = itens.map((i) => ({
    agendamento_id: agendamentoId,
    procedimento_id: i.procedimento_id,
    nome: i.nome,
    preco: i.preco,
    duracao_min: i.duracao_min,
  }))
  const { error } = await supabase.from('agendamento_procedimentos').insert(linhas)
  if (error) throw error
}

// Sincroniza (best-effort) um agendamento com o Google Agenda.
// Nunca lança erro: se o Google estiver fora, a consulta é salva normalmente.
async function sincronizarGoogle(id: string, deletar = false): Promise<void> {
  try {
    await apiPost('/api/google/sync', { id, deletar })
  } catch {
    // ignora: sincronização é best-effort
  }
}

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

// Agendamentos num intervalo (usado por mês e semana). Datas em ISO/UTC.
export function useAgendamentosIntervalo(iniISO: string, fimISO: string) {
  return useQuery({
    queryKey: [CHAVE, 'intervalo', iniISO, fimISO],
    queryFn: async (): Promise<AgendamentoComNomes[]> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(SELECT)
        .gte('inicio', iniISO)
        .lt('inicio', fimISO)
        .order('inicio')
      if (error) throw error
      return (data ?? []) as unknown as AgendamentoComNomes[]
    },
  })
}

// Próximos agendamentos a partir de agora (ignora cancelados).
export function useProximosAgendamentos(limite = 10) {
  return useQuery({
    queryKey: [CHAVE, 'proximos', limite],
    queryFn: async (): Promise<AgendamentoComNomes[]> => {
      const agora = new Date().toISOString()
      const { data, error } = await supabase
        .from('agendamentos')
        .select(SELECT)
        .gte('inicio', agora)
        .neq('status', 'cancelado')
        .order('inicio')
        .limit(limite)
      if (error) throw error
      return (data ?? []) as unknown as AgendamentoComNomes[]
    },
  })
}

// Consultas de um paciente (mais recentes primeiro), pra tela do paciente.
export function useAgendamentosDoPaciente(pacienteId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'paciente', pacienteId],
    enabled: !!pacienteId,
    queryFn: async (): Promise<AgendamentoComNomes[]> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(SELECT)
        .eq('paciente_id', pacienteId!)
        .order('inicio', { ascending: false })
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
      await sincronizarGoogle(data.id)
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
      await sincronizarGoogle(args.id)
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
      // Cancelar apaga o evento; outros status atualizam.
      await sincronizarGoogle(args.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useExcluirAgendamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Apaga o evento no Google ANTES de remover a linha (ainda dá pra ler o id do evento).
      await sincronizarGoogle(id, true)
      const { error } = await supabase.from('agendamentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

// ----- Leitura dos eventos do próprio Google Agenda (pra mostrar no app) -----
export type GoogleEvento = {
  id: string
  titulo: string
  inicio: string | null
  fim: string | null
  diaInteiro: boolean
}

export function useGoogleEventos(iniISO: string, fimISO: string, ativo = true) {
  return useQuery({
    queryKey: ['google-eventos', iniISO, fimISO],
    enabled: ativo,
    staleTime: 60_000,
    retry: false,
    queryFn: () =>
      apiGet<{ conectado: boolean; eventos: GoogleEvento[] }>(
        `/api/google/events?ini=${encodeURIComponent(iniISO)}&fim=${encodeURIComponent(fimISO)}`,
      ),
  })
}
