import { Link } from 'react-router-dom'
import type { AgendamentoComNomes } from '../../lib/types'
import { horaLocal } from '../../lib/format'
import { STATUS_INFO } from './status'

// Linha de consulta usada nas listas (próximos, semana, dia).
// mostrarData: nas listas com dias diferentes (ex.: "Próximos"), mostra a data.
export function AgendamentoItem({
  a,
  mostrarData = false,
}: {
  a: AgendamentoComNomes
  mostrarData?: boolean
}) {
  const info = STATUS_INFO[a.status]
  const dataCurta = new Date(a.inicio).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
  return (
    <Link
      to={`/agenda/${a.id}`}
      className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
    >
      <span className="flex w-14 shrink-0 flex-col items-center">
        {mostrarData && (
          <span className="text-xs font-bold text-brand-700">{dataCurta}</span>
        )}
        <span className="font-bold text-slate-900 dark:text-slate-50">{horaLocal(a.inicio)}</span>
        {!mostrarData && <span className="text-xs text-slate-400 dark:text-slate-500">{horaLocal(a.fim)}</span>}
      </span>
      <span className="h-9 w-px bg-slate-200 dark:bg-slate-700" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-slate-900 dark:text-slate-50">
          {a.paciente?.nome ?? 'Sem paciente'}
        </span>
        <span className="block truncate text-sm text-slate-500 dark:text-slate-400">
          {a.procedimento?.nome ?? '—'}
        </span>
        {a.origem === 'online' && a.status === 'agendado' && (
          <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
            Online · a confirmar
          </span>
        )}
      </span>
      <span className={'shrink-0 rounded-full px-2 py-1 text-xs font-bold ' + info.classe}>
        {info.rotulo}
      </span>
    </Link>
  )
}
