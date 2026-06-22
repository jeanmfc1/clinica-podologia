import { Link } from 'react-router-dom'
import type { AgendamentoComNomes } from '../../lib/types'
import { horaLocal } from '../../lib/format'
import { STATUS_INFO } from './status'

// Linha de consulta usada nas listas (próximos, semana, dia).
export function AgendamentoItem({ a }: { a: AgendamentoComNomes }) {
  const info = STATUS_INFO[a.status]
  return (
    <Link
      to={`/agenda/${a.id}`}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
    >
      <span className="flex w-12 shrink-0 flex-col items-center">
        <span className="font-bold text-slate-900">{horaLocal(a.inicio)}</span>
        <span className="text-xs text-slate-400">{horaLocal(a.fim)}</span>
      </span>
      <span className="h-9 w-px bg-slate-200" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-slate-900">
          {a.paciente?.nome ?? 'Sem paciente'}
        </span>
        <span className="block truncate text-sm text-slate-500">
          {a.procedimento?.nome ?? '—'}
        </span>
      </span>
      <span className={'shrink-0 rounded-full px-2 py-1 text-xs font-bold ' + info.classe}>
        {info.rotulo}
      </span>
    </Link>
  )
}
