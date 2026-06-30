import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  useAgendamentosIntervalo,
  useGoogleEventos,
  useProximosAgendamentos,
  type GoogleEvento,
} from '../features/agenda/api'
import { AgendamentoItem } from '../features/agenda/AgendamentoItem'
import type { AgendamentoComNomes } from '../lib/types'
import {
  dataLocalISO,
  dataPorExtenso,
  horaLocal,
  hojeISO,
  somarDias,
} from '../lib/format'
import { Aviso, PageHeader } from '../components/ui'
import { APP_VERSION, APP_VERSION_DATA } from '../lib/version'

type Modo = 'mes' | 'semana' | 'dia'

const SEMANA_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function localISO(d: Date): string {
  return dataLocalISO(d.toISOString())
}
function addDias(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// Calcula o intervalo (ISO/UTC) a ser buscado conforme a visão.
function calcularRange(modo: Modo, refDate: string) {
  const base = new Date(`${refDate}T00:00:00`)
  let ini: Date
  let fim: Date
  if (modo === 'dia') {
    ini = base
    fim = addDias(base, 1)
  } else if (modo === 'semana') {
    ini = addDias(base, -base.getDay()) // volta para domingo
    fim = addDias(ini, 7)
  } else {
    const primeiro = new Date(base.getFullYear(), base.getMonth(), 1)
    ini = addDias(primeiro, -primeiro.getDay()) // domingo antes do mês
    fim = addDias(ini, 42) // 6 semanas
  }
  return { ini, fim, iniISO: ini.toISOString(), fimISO: fim.toISOString() }
}

export function AgendaPage() {
  const [params] = useSearchParams()
  const [modo, setModo] = useState<Modo>('mes')
  const [refDate, setRefDate] = useState(params.get('dia') || hojeISO())

  const range = useMemo(() => calcularRange(modo, refDate), [modo, refDate])
  const { data: lista, isLoading } = useAgendamentosIntervalo(range.iniISO, range.fimISO)
  const { data: proximos } = useProximosAgendamentos(8)
  // Eventos do Google só na visão "Dia" (pra ver os compromissos pessoais junto).
  const { data: google } = useGoogleEventos(range.iniISO, range.fimISO, modo === 'dia')

  // Agrupa por dia (chave 'AAAA-MM-DD').
  const porDia = useMemo(() => {
    const m = new Map<string, AgendamentoComNomes[]>()
    for (const a of lista ?? []) {
      const k = dataLocalISO(a.inicio)
      const arr = m.get(k) ?? []
      arr.push(a)
      m.set(k, arr)
    }
    return m
  }, [lista])

  function navegar(dir: number) {
    if (modo === 'dia') setRefDate(somarDias(refDate, dir))
    else if (modo === 'semana') setRefDate(somarDias(refDate, dir * 7))
    else {
      const b = new Date(`${refDate}T00:00:00`)
      setRefDate(localISO(new Date(b.getFullYear(), b.getMonth() + dir, 1)))
    }
  }

  const tituloPeriodo = useMemo(() => {
    const b = new Date(`${refDate}T00:00:00`)
    if (modo === 'dia') return dataPorExtenso(refDate)
    if (modo === 'mes')
      return b.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const ini = addDias(b, -b.getDay())
    const fim = addDias(ini, 6)
    return `${ini.getDate()}/${ini.getMonth() + 1} – ${fim.getDate()}/${fim.getMonth() + 1}`
  }, [modo, refDate])

  return (
    <section>
      <PageHeader
        titulo="Agenda"
        acao={
          <Link
            to={`/agenda/novo?dia=${refDate}`}
            className="min-h-[44px] rounded-lg bg-brand-700 px-4 py-2 font-bold text-white"
          >
            + Novo
          </Link>
        }
      />

      {/* Próximos agendamentos */}
      <h2 className="mb-2 font-bold text-slate-800">Próximos agendamentos</h2>
      {proximos && proximos.length === 0 && (
        <Aviso>Nenhuma consulta marcada daqui pra frente.</Aviso>
      )}
      {proximos && proximos.length > 0 && (
        <ul className="mb-6 flex flex-col gap-2">
          {proximos.map((a) => (
            <li key={a.id}>
              <AgendamentoItem a={a} />
            </li>
          ))}
        </ul>
      )}

      {/* Seletor de visão */}
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
        {(['mes', 'semana', 'dia'] as Modo[]).map((m) => (
          <button
            key={m}
            onClick={() => setModo(m)}
            className={
              'min-h-[40px] rounded-md font-bold ' +
              (modo === m ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500')
            }
          >
            {m === 'mes' ? 'Mês' : m === 'semana' ? 'Semana' : 'Dia'}
          </button>
        ))}
      </div>

      {/* Navegação do período */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          onClick={() => navegar(-1)}
          aria-label="Anterior"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
        >
          ‹
        </button>
        <button
          onClick={() => setRefDate(hojeISO())}
          className="flex-1 rounded-lg bg-white px-3 py-2 text-center font-bold capitalize text-slate-900"
        >
          {tituloPeriodo}
        </button>
        <button
          onClick={() => navegar(1)}
          aria-label="Próximo"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
        >
          ›
        </button>
      </div>

      {isLoading && <Aviso>Carregando…</Aviso>}

      {/* Visão MÊS */}
      {modo === 'mes' && (
        <MesGrade
          refDate={refDate}
          iniGrade={range.ini}
          porDia={porDia}
          aoTocarDia={(dia) => {
            setRefDate(dia)
            setModo('dia')
          }}
        />
      )}

      {/* Visão SEMANA */}
      {modo === 'semana' && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = addDias(range.ini, i)
            const k = localISO(d)
            const doDia = porDia.get(k) ?? []
            return (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-bold capitalize text-slate-800">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </span>
                  <Link to={`/agenda/novo?dia=${k}`} className="text-sm font-bold text-brand-700">
                    + marcar
                  </Link>
                </div>
                {doDia.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 p-2 text-center text-sm text-slate-400">
                    livre
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {doDia.map((a) => (
                      <li key={a.id}>
                        <AgendamentoItem a={a} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Visão DIA */}
      {modo === 'dia' && (
        <DiaLista doDia={porDia.get(refDate) ?? []} google={google?.eventos ?? []} />
      )}

      {/* Versão do app — confere se está rodando a mais nova. */}
      <p className="mt-8 text-center text-xs text-slate-400">
        Pés de Anjo · versão {APP_VERSION} ({APP_VERSION_DATA})
      </p>
    </section>
  )
}

function DiaLista({
  doDia,
  google,
}: {
  doDia: AgendamentoComNomes[]
  google: GoogleEvento[]
}) {
  if (doDia.length === 0 && google.length === 0)
    return <Aviso>Nenhuma consulta neste dia.</Aviso>

  return (
    <div className="flex flex-col gap-5">
      {doDia.length > 0 && (
        <ul className="flex flex-col gap-2">
          {doDia.map((a) => (
            <li key={a.id}>
              <AgendamentoItem a={a} />
            </li>
          ))}
        </ul>
      )}

      {google.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-500">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            Do seu Google Agenda
          </h3>
          <ul className="flex flex-col gap-2">
            {google.map((e) => (
              <li key={e.id}>
                <GoogleEventoItem e={e} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function GoogleEventoItem({ e }: { e: GoogleEvento }) {
  const hora = e.diaInteiro ? 'Dia inteiro' : e.inicio ? horaLocal(e.inicio) : ''
  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
      <span className="w-16 shrink-0 text-sm font-bold tabular-nums text-blue-700">{hora}</span>
      <span className="flex-1 text-slate-700">{e.titulo}</span>
    </div>
  )
}

function MesGrade({
  refDate,
  iniGrade,
  porDia,
  aoTocarDia,
}: {
  refDate: string
  iniGrade: Date
  porDia: Map<string, AgendamentoComNomes[]>
  aoTocarDia: (dia: string) => void
}) {
  const mesAtual = new Date(`${refDate}T00:00:00`).getMonth()
  const hoje = hojeISO()

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400">
        {SEMANA_LABELS.map((l) => (
          <div key={l} className="py-1">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }).map((_, i) => {
          const d = addDias(iniGrade, i)
          const k = localISO(d)
          const qtd = (porDia.get(k) ?? []).length
          const noMes = d.getMonth() === mesAtual
          const ehHoje = k === hoje
          return (
            <button
              key={k}
              onClick={() => aoTocarDia(k)}
              className={
                'flex aspect-square flex-col items-center justify-center rounded-lg border text-sm ' +
                (noMes ? 'bg-white text-slate-800' : 'bg-slate-50 text-slate-300') +
                (ehHoje ? ' border-brand-600 font-bold' : ' border-slate-200')
              }
            >
              <span>{d.getDate()}</span>
              {qtd > 0 && (
                <span className="mt-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {qtd}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
