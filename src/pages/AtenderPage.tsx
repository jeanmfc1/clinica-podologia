import { Link } from 'react-router-dom'
import { useAgendamentosDoDia } from '../features/agenda/api'
import { dataPorExtenso, horaLocal, hojeISO } from '../lib/format'
import { Aviso, PageHeader } from '../components/ui'

// Lista as consultas de hoje; tocar leva direto a registrar o atendimento.
export function AtenderPage() {
  const hoje = hojeISO()
  const { data: lista, isLoading } = useAgendamentosDoDia(hoje)
  const consultas = (lista ?? []).filter((a) => a.status !== 'cancelado')

  return (
    <section>
      <PageHeader titulo="Atender" />
      <p className="mb-4 capitalize text-slate-600">{dataPorExtenso(hoje)}</p>

      {isLoading && <Aviso>Carregando…</Aviso>}
      {!isLoading && consultas.length === 0 && (
        <Aviso>Nenhuma consulta para hoje.</Aviso>
      )}

      <ul className="flex flex-col gap-2">
        {consultas.map((a) => {
          const conteudo = (
            <>
              <span className="flex w-12 shrink-0 flex-col items-center">
                <span className="font-bold text-slate-900">{horaLocal(a.inicio)}</span>
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
              <span className="shrink-0 rounded-lg bg-brand-700 px-3 py-2 text-sm font-bold text-white">
                Atender
              </span>
            </>
          )

          // Sem paciente vinculado não dá pra abrir o prontuário.
          return (
            <li key={a.id}>
              {a.paciente_id ? (
                <Link
                  to={`/pacientes/${a.paciente_id}/atendimentos/novo?agendamento=${a.id}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                >
                  {conteudo}
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 opacity-60">
                  {conteudo}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
