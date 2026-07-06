import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  rotuloForma,
  useMarcarRecebido,
  usePagamentosIntervalo,
  usePendentes,
} from '../features/financeiro/api'
import type { PagamentoComPaciente } from '../lib/types'
import { dataLocalISO, formatData, formatReal, hojeISO } from '../lib/format'
import { Aviso, PageHeader } from '../components/ui'

export function FinanceiroPage() {
  const [refDate, setRefDate] = useState(hojeISO())
  const marcarRecebido = useMarcarRecebido()

  const range = useMemo(() => {
    const b = new Date(`${refDate}T00:00:00`)
    const ini = new Date(b.getFullYear(), b.getMonth(), 1)
    const fim = new Date(b.getFullYear(), b.getMonth() + 1, 1)
    return { iniISO: ini.toISOString(), fimISO: fim.toISOString() }
  }, [refDate])

  const { data: lista, isLoading } = usePagamentosIntervalo(range.iniISO, range.fimISO)
  const { data: pendentes } = usePendentes()

  // Totais do mês (só o que já foi pago/recebido).
  const { entrou, saiu } = useMemo(() => {
    let entrou = 0
    let saiu = 0
    for (const p of lista ?? []) {
      if (p.status !== 'pago') continue
      if (p.tipo === 'entrada') entrou += Number(p.valor)
      else saiu += Number(p.valor)
    }
    return { entrou, saiu }
  }, [lista])
  const saldo = entrou - saiu

  const aReceber = useMemo(
    () =>
      (pendentes ?? [])
        .filter((p) => p.tipo === 'entrada')
        .reduce((s, p) => s + Number(p.valor), 0),
    [pendentes],
  )

  const tituloMes = new Date(`${refDate}T00:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  function mudarMes(dir: number) {
    const b = new Date(`${refDate}T00:00:00`)
    setRefDate(dataLocalISO(new Date(b.getFullYear(), b.getMonth() + dir, 1).toISOString()))
  }

  return (
    <section>
      <PageHeader
        titulo="Financeiro"
        acao={
          <Link
            to="/financeiro/novo"
            className="min-h-[44px] rounded-lg bg-brand-700 px-4 py-2 font-bold text-white"
          >
            + Novo
          </Link>
        }
      />

      <Link
        to="/vender"
        className="mb-4 flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-bold text-white"
      >
        💰 Vender produto
      </Link>

      {/* Navegação do mês */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          onClick={() => mudarMes(-1)}
          aria-label="Mês anterior"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
        >
          ‹
        </button>
        <span className="flex-1 text-center font-bold capitalize text-slate-900 dark:text-slate-50">{tituloMes}</span>
        <button
          onClick={() => mudarMes(1)}
          aria-label="Próximo mês"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
        >
          ›
        </button>
      </div>

      {/* Resumo do mês */}
      <div className="mb-2 grid grid-cols-3 gap-2">
        <Card titulo="Entrou" valor={entrou} cor="text-green-700" />
        <Card titulo="Saiu" valor={saiu} cor="text-red-700" />
        <Card titulo="Saldo" valor={saldo} cor={saldo >= 0 ? 'text-brand-800' : 'text-red-700'} />
      </div>

      {/* A receber (fiado) */}
      {pendentes && pendentes.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold text-amber-800">A receber (fiado)</span>
            <span className="font-bold text-amber-800">{formatReal(aReceber)}</span>
          </div>
          <ul className="flex flex-col gap-2">
            {pendentes.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-800 p-2"
              >
                <Link to={`/financeiro/${p.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-slate-900 dark:text-slate-50">
                    {p.paciente?.nome ?? p.descricao ?? 'A receber'}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {formatReal(Number(p.valor))}
                    {p.vencimento ? ` · vence ${formatData(p.vencimento)}` : ''}
                  </span>
                </Link>
                <button
                  onClick={() => marcarRecebido.mutate(p.id)}
                  disabled={marcarRecebido.isPending}
                  className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white"
                >
                  Recebido
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lançamentos do mês */}
      {isLoading && <Aviso>Carregando…</Aviso>}
      {!isLoading && (!lista || lista.length === 0) && (
        <Aviso>Nenhum lançamento neste mês.</Aviso>
      )}
      <ul className="flex flex-col gap-2">
        {(lista ?? []).map((p) => (
          <li key={p.id}>
            <PagamentoLinha p={p} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Card({ titulo, valor, cor }: { titulo: string; valor: number; cor: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">{titulo}</p>
      <p className={'text-base font-bold ' + cor}>{formatReal(valor)}</p>
    </div>
  )
}

function PagamentoLinha({ p }: { p: PagamentoComPaciente }) {
  const entrada = p.tipo === 'entrada'
  return (
    <Link
      to={`/financeiro/${p.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
    >
      <span className="min-w-0">
        <span className="block truncate font-bold text-slate-900 dark:text-slate-50">
          {p.paciente?.nome ?? p.descricao ?? (entrada ? 'Entrada' : 'Saída')}
        </span>
        <span className="block text-sm text-slate-500 dark:text-slate-400">
          {formatData(p.data)} · {p.categoria ? p.categoria + ' · ' : ''}
          {rotuloForma(p.forma)}
          {p.status === 'pendente' ? ' · fiado' : ''}
        </span>
      </span>
      <span className={'shrink-0 font-bold ' + (entrada ? 'text-green-700' : 'text-red-700')}>
        {entrada ? '+' : '−'} {formatReal(Number(p.valor))}
      </span>
    </Link>
  )
}
