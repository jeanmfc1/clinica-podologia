import { horarioTrabalho } from '../config'
import { combinarDataHora } from './format'

// Camada pública do agendamento online (não usa login).

export type ProcedimentoPublico = {
  id: string
  nome: string
  duracao_min: number
  preco: number
}

export type Ocupado = { inicio: string; fim: string }

export type PacienteForm = {
  nome: string
  telefone: string
  nascimento: string | null
  documento: string | null
  endereco: string | null
}

export type PedidoAgendamento = {
  procedimento_id: string | null
  inicio: string
  fim: string
  paciente: PacienteForm
  anamnese: Record<string, unknown>
}

export async function buscarProcedimentos(): Promise<ProcedimentoPublico[]> {
  const r = await fetch('/api/agendar/procedimentos')
  if (!r.ok) throw new Error('falha')
  const data = (await r.json()) as { procedimentos: ProcedimentoPublico[] }
  return data.procedimentos ?? []
}

export async function buscarOcupados(iniISO: string, fimISO: string): Promise<Ocupado[]> {
  const r = await fetch(
    `/api/agendar/ocupados?ini=${encodeURIComponent(iniISO)}&fim=${encodeURIComponent(fimISO)}`,
  )
  if (!r.ok) return []
  const data = (await r.json()) as { ocupados: Ocupado[] }
  return data.ocupados ?? []
}

export async function enviarAgendamento(pedido: PedidoAgendamento): Promise<void> {
  const r = await fetch('/api/agendar', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(pedido),
  })
  if (!r.ok) {
    const e = (await r.json().catch(() => null)) as { erro?: string } | null
    throw new Error(e?.erro || 'Não foi possível enviar.')
  }
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const minToHHMM = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`

// Gera os horários candidatos do dia (a cada 30 min) conforme o expediente,
// já tirando o horário de almoço.
export function gerarSlots(dataISO: string, duracaoMin: number): string[] {
  const dow = new Date(`${dataISO}T00:00:00`).getDay()
  const exp = horarioTrabalho[dow]
  if (!exp || !duracaoMin) return []

  const passo = 30
  const ini = toMin(exp.inicio)
  const fim = toMin(exp.fim)
  const almIni = exp.almoco ? toMin(exp.almoco.inicio) : null
  const almFim = exp.almoco ? toMin(exp.almoco.fim) : null

  const slots: string[] = []
  for (let t = ini; t + duracaoMin <= fim; t += passo) {
    const tFim = t + duracaoMin
    // Pula se o atendimento cairia em cima do almoço.
    if (almIni != null && almFim != null && t < almFim && tFim > almIni) continue
    slots.push(minToHHMM(t))
  }
  return slots
}

// Filtra os candidatos: tira os que estão no passado ou em cima de algo ocupado.
export function filtrarLivres(
  dataISO: string,
  candidatos: string[],
  duracaoMin: number,
  ocupados: Ocupado[],
): string[] {
  const agora = Date.now()
  return candidatos.filter((hhmm) => {
    const ini = new Date(combinarDataHora(dataISO, hhmm)).getTime()
    const fim = ini + duracaoMin * 60000
    if (ini < agora) return false
    for (const o of ocupados) {
      const oi = new Date(o.inicio).getTime()
      const of = new Date(o.fim).getTime()
      if (ini < of && fim > oi) return false // sobreposição
    }
    return true
  })
}
