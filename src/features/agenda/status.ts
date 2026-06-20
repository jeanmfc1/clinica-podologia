import type { StatusAgendamento } from '../../lib/types'

// Rótulo e cores de cada status (usado nas etiquetas da agenda).
export const STATUS_INFO: Record<
  StatusAgendamento,
  { rotulo: string; classe: string }
> = {
  agendado: { rotulo: 'Agendado', classe: 'bg-slate-100 text-slate-700' },
  confirmado: { rotulo: 'Confirmado', classe: 'bg-brand-100 text-brand-800' },
  atendido: { rotulo: 'Atendido', classe: 'bg-green-100 text-green-800' },
  faltou: { rotulo: 'Faltou', classe: 'bg-amber-100 text-amber-800' },
  cancelado: { rotulo: 'Cancelado', classe: 'bg-red-100 text-red-700' },
}

export const STATUS_LISTA: StatusAgendamento[] = [
  'agendado',
  'confirmado',
  'atendido',
  'faltou',
  'cancelado',
]
