import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { rotuloForma, usePagamentosIntervalo } from '../features/financeiro/api'
import type { PagamentoComPaciente } from '../lib/types'
import { dataLocalISO, formatData, formatReal, hojeISO } from '../lib/format'
import { Aviso, PageHeader } from '../components/ui'

export function FinanceiroPage() {
  const [refDate, setRefDate] = useState(hojeISO())

  const range = useMemo(() => {
    const b = new Date(`${refDate}T00:00:00`)
    const ini = new Date(b.getFullYear(), b.getMonth(), 1)
    const fim = new Date(b.getFullYear(), b.getMonth() + 1, 1)
    return { iniISO: ini.toISOString(), fimISO: fim.toISOString() }
  }, [refDate])

  const { data: lista, isLoading } = usePagamentosIntervalo(range.iniISO, range.fimISO)

  const totalMes = useMemo(
    () => (lista ?? []).reduce((s, p) => s + Number(p.valor), 0),
    [lista],
  )
  const totalHoje = useMemo(() => {
    const hoje = hojeISO()
    return (lista ?? [])
      .filter((p) => dataLocalISO(p.data) === hoje)
      .reduce((s, p) => s + Number(p.valor), 0)
  }, [lista])

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

      {/* Resumo */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Hoje</p>
          <p className="text-xl font-bold text-brand-800">{formatReal(totalHoje)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">No mês</p>
          <p className="text-xl font-bold text-brand-800">{formatReal(totalMes)}</p>
        </div>
      </div>

      {/* Navegação do mês */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          onClick={() => mudarMes(-1)}
          aria-label="Mês anterior"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
        >
          ‹
        </button>
        <span className="flex-1 text-center font-bold capitalize text-slate-900">{tituloMes}</span>
        <button
          onClick={() => mudarMes(1)}
          aria-label="Próximo mês"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
        >
          ›
        </button>
      </div>

      {isLoading && <Aviso>Carregando…</Aviso>}
      {!isLoading && (!lista || lista.length === 0) && (
        <Aviso>Nenhum pagamento neste mês.</Aviso>
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

function PagamentoLinha({ p }: { p: PagamentoComPaciente }) {
  return (
    <Link
      to={`/financeiro/${p.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
    >
      <span className="min-w-0">
        <span className="block truncate font-bold text-slate-900">
          {p.paciente?.nome ?? p.descricao ?? 'Pagamento'}
        </span>
        <span className="block text-sm text-slate-500">
          {formatData(p.data)} · {rotuloForma(p.forma)}
        </span>
      </span>
      <span className="shrink-0 font-bold text-green-700">{formatReal(Number(p.valor))}</span>
    </Link>
  )
}
