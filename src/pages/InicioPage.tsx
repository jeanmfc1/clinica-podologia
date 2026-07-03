import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  useAgendamentosDoDia,
  useProximosAgendamentos,
} from '../features/agenda/api'
import { usePagamentosIntervalo, usePendentes } from '../features/financeiro/api'
import { estaFaltando, useEstoque } from '../features/estoque/api'
import { AgendamentoItem } from '../features/agenda/AgendamentoItem'
import { clinica } from '../config'
import { APP_VERSION, APP_VERSION_DATA } from '../lib/version'
import { dataPorExtenso, formatReal, hojeISO } from '../lib/format'

export function InicioPage() {
  const hoje = hojeISO()

  const range = useMemo(() => {
    const ini = new Date(`${hoje}T00:00:00`)
    const fim = new Date(ini)
    fim.setDate(fim.getDate() + 1)
    return { iniISO: ini.toISOString(), fimISO: fim.toISOString() }
  }, [hoje])

  const { data: doDia } = useAgendamentosDoDia(hoje)
  const { data: proximos } = useProximosAgendamentos(20)
  const { data: pagamentosHoje } = usePagamentosIntervalo(range.iniISO, range.fimISO)
  const { data: pendentes } = usePendentes()
  const { data: estoque } = useEstoque()

  const faltando = (estoque ?? []).filter(estaFaltando)
  const consultasHoje = (doDia ?? []).filter((a) => a.status !== 'cancelado')
  const aConfirmar = (proximos ?? []).filter((a) => a.status === 'agendado')
  const entrouHoje = (pagamentosHoje ?? [])
    .filter((p) => p.tipo === 'entrada' && p.status === 'pago')
    .reduce((s, p) => s + Number(p.valor), 0)
  const aReceber = (pendentes ?? [])
    .filter((p) => p.tipo === 'entrada')
    .reduce((s, p) => s + Number(p.valor), 0)

  return (
    <section>
      <header className="mb-4">
        <h1 className="text-xl font-bold text-brand-800">{clinica.nome}</h1>
        <p className="text-sm capitalize text-slate-500 dark:text-slate-400">{dataPorExtenso(hoje)}</p>
      </header>

      {/* Resumo rápido */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <Mini titulo="Hoje" valor={`${consultasHoje.length}`} sub="consultas" />
        <Mini titulo="Entrou hoje" valor={formatReal(entrouHoje)} cor="text-green-700" />
        <Link to="/financeiro" className="block">
          <Mini titulo="A receber" valor={formatReal(aReceber)} cor="text-amber-700" />
        </Link>
      </div>

      {/* Estoque acabando */}
      {faltando.length > 0 && (
        <Link
          to="/estoque"
          className="mb-5 block rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10"
        >
          <p className="font-bold text-amber-800 dark:text-amber-300">
            ⚠️ {faltando.length}{' '}
            {faltando.length === 1 ? 'material acabando' : 'materiais acabando'}
          </p>
          <p className="mt-0.5 truncate text-sm text-amber-700 dark:text-amber-200">
            {faltando.map((i) => i.nome).join(', ')}
          </p>
        </Link>
      )}

      {/* Consultas de hoje */}
      <SecaoTitulo titulo="Consultas de hoje" link="/agenda" linkRotulo="Ver agenda" />
      {consultasHoje.length === 0 ? (
        <Vazio>Nenhuma consulta hoje.</Vazio>
      ) : (
        <ul className="mb-5 flex flex-col gap-2">
          {consultasHoje.map((a) => (
            <li key={a.id}>
              <AgendamentoItem a={a} />
            </li>
          ))}
        </ul>
      )}

      {/* A confirmar */}
      {aConfirmar.length > 0 && (
        <>
          <SecaoTitulo titulo={`A confirmar (${aConfirmar.length})`} />
          <ul className="mb-5 flex flex-col gap-2">
            {aConfirmar.slice(0, 6).map((a) => (
              <li key={a.id}>
                <AgendamentoItem a={a} mostrarData />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Versão do app — confere se está rodando a mais nova. */}
      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Pés de Anjo · versão {APP_VERSION} ({APP_VERSION_DATA})
      </p>
    </section>
  )
}

function Mini({
  titulo,
  valor,
  sub,
  cor = 'text-slate-900 dark:text-slate-50',
}: {
  titulo: string
  valor: string
  sub?: string
  cor?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">{titulo}</p>
      <p className={'text-base font-bold ' + cor}>{valor}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  )
}

function SecaoTitulo({
  titulo,
  link,
  linkRotulo,
}: {
  titulo: string
  link?: string
  linkRotulo?: string
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="font-bold text-slate-800 dark:text-slate-100">{titulo}</h2>
      {link && (
        <Link to={link} className="text-sm font-bold text-brand-700">
          {linkRotulo}
        </Link>
      )}
    </div>
  )
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-3 text-center text-sm text-slate-400 dark:text-slate-500">
      {children}
    </p>
  )
}
