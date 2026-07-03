import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// Paciente que não volta há um tempo (pra chamar de novo).
export type PacienteInativo = {
  id: string
  nome: string
  telefone: string | null
  ultimaVisita: string // ISO da última consulta passada
}

// Pacientes cuja última consulta (não cancelada) foi há mais de `dias` e que
// não têm nenhuma consulta futura marcada. Do que sumiu há mais tempo ao mais
// recente.
export function usePacientesInativos(dias = 60) {
  return useQuery({
    queryKey: ['relatorios', 'inativos', dias],
    queryFn: async (): Promise<PacienteInativo[]> => {
      const agora = new Date()
      const limite = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate() - dias,
      )

      const { data: ags, error } = await supabase
        .from('agendamentos')
        .select('paciente_id, inicio')
        .neq('status', 'cancelado')
        .order('inicio', { ascending: false })
      if (error) throw error

      const temFuturo = new Set<string>()
      const ultimaPassada = new Map<string, string>()
      for (const a of (ags ?? []) as { paciente_id: string | null; inicio: string }[]) {
        if (!a.paciente_id) continue
        if (new Date(a.inicio) >= agora) temFuturo.add(a.paciente_id)
        else if (!ultimaPassada.has(a.paciente_id))
          ultimaPassada.set(a.paciente_id, a.inicio)
      }

      const { data: pacs, error: e2 } = await supabase
        .from('pacientes')
        .select('id, nome, telefone')
      if (e2) throw e2

      const inativos: PacienteInativo[] = []
      for (const p of (pacs ?? []) as {
        id: string
        nome: string
        telefone: string | null
      }[]) {
        const u = ultimaPassada.get(p.id)
        if (u && !temFuturo.has(p.id) && new Date(u) < limite) {
          inativos.push({ id: p.id, nome: p.nome, telefone: p.telefone, ultimaVisita: u })
        }
      }
      inativos.sort(
        (a, b) => new Date(a.ultimaVisita).getTime() - new Date(b.ultimaVisita).getTime(),
      )
      return inativos
    },
  })
}
