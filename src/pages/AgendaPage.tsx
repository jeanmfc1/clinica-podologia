import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAgendamentosDoDia } from '../features/agenda/api'
import { STATUS_INFO } from '../features/agenda/status'
import { dataPorExtenso, horaLocal, hojeISO, somarDias } from '../lib/format'
import { Aviso, PageHeader } from '../components/ui'

export function AgendaPage() {
  const [params] = useSearchParams()
  const [dia, setDia] = useState(params.get('dia') || hojeISO())
  const { data: lista, isLoading, isError } = useAgendamentosDoDia(dia)
  const ehHoje = dia === hojeISO()

  return (
    <section>
      <PageHeader
        titulo="Agenda"
        acao={
          <Link
            to={`/agenda/novo?dia=${dia}`}
            className="min-h-[44px] rounded-lg bg-brand-700 px-4 py-2 font-bold text-white"
          >
            + Novo
          </Link>
        }
      />

      {/* Navegação de dia */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setDia(somarDias(dia, -1))}
          aria-label="Dia anterior"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
        >
          ‹
        </button>
        <button
          onClick={() => setDia(hojeISO())}
          className="flex-1 rounded-lg bg-white px-3 py-2 text-center"
        >
          <span className="block font-bold capitalize text-slate-900">
            {dataPorExtenso(dia)}
          </span>
          {!ehHoje && <span className="text-sm text-brand-700">voltar para hoje</span>}
        </button>
        <button
          onClick={() => setDia(somarDias(dia, 1))}
          aria-label="Próximo dia"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
        >
          ›
        </button>
      </div>

      {isLoading && <Aviso>Carregando…</Aviso>}
      {isError && <Aviso>Não foi possível carregar a agenda.</Aviso>}

      {lista && lista.length === 0 && (
        <Aviso>Nenhuma consulta neste dia.</Aviso>
      )}

      {lista && lista.length > 0 && (
        <ul className="flex flex-col gap-2">
          {lista.map((a) => {
            const info = STATUS_INFO[a.status]
            return (
              <li key={a.id}>
                <Link
                  to={`/agenda/${a.id}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <span className="flex flex-col items-center">
                    <span className="font-bold text-slate-900">{horaLocal(a.inicio)}</span>
                    <span className="text-xs text-slate-400">{horaLocal(a.fim)}</span>
                  </span>
                  <span className="h-10 w-px bg-slate-200" />
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
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
