import { Link } from 'react-router-dom'
import {
  estaFaltando,
  useAjustarQuantidade,
  useEstoque,
} from '../features/estoque/api'
import type { ItemEstoque } from '../lib/types'
import { Aviso, PageHeader } from '../components/ui'

// Mostra número inteiro quando não tem casas; senão, com vírgula.
function formatQtd(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR')
}

export function EstoquePage() {
  const { data: lista, isLoading, isError } = useEstoque()
  const faltando = (lista ?? []).filter(estaFaltando)

  return (
    <section>
      <PageHeader
        titulo="Estoque"
        voltar
        acao={
          <Link
            to="/estoque/novo"
            className="min-h-[44px] rounded-lg bg-brand-700 px-4 py-2 font-bold text-white"
          >
            + Novo
          </Link>
        }
      />

      {isLoading && <Aviso>Carregando…</Aviso>}
      {isError && <Aviso>Não foi possível carregar o estoque.</Aviso>}

      {lista && lista.length === 0 && (
        <Aviso>
          Nenhum material cadastrado ainda. Toque em <b>+ Novo</b> pra começar
          (lâminas, cremes, descartáveis…).
        </Aviso>
      )}

      {/* Alerta do que está acabando. */}
      {faltando.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="font-bold text-amber-800 dark:text-amber-300">
            ⚠️ {faltando.length}{' '}
            {faltando.length === 1 ? 'material acabando' : 'materiais acabando'}
          </p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-200">
            {faltando.map((i) => i.nome).join(', ')}
          </p>
        </div>
      )}

      {lista && lista.length > 0 && (
        <ul className="flex flex-col gap-2">
          {lista.map((item) => (
            <li key={item.id}>
              <ItemLinha item={item} formatQtd={formatQtd} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ItemLinha({
  item,
  formatQtd,
}: {
  item: ItemEstoque
  formatQtd: (n: number) => string
}) {
  const ajustar = useAjustarQuantidade()
  const falta = estaFaltando(item)

  function mudar(delta: number) {
    ajustar.mutate({ id: item.id, atual: item.quantidade, delta })
  }

  return (
    <div
      className={
        'flex items-center gap-3 rounded-lg border p-3 ' +
        (falta
          ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800')
      }
    >
      <Link to={`/estoque/${item.id}`} className="min-w-0 flex-1">
        <span className="block truncate font-bold text-slate-900 dark:text-slate-50">
          {item.nome}
        </span>
        <span className="block truncate text-sm text-slate-500 dark:text-slate-400">
          {formatQtd(item.quantidade)} {item.unidade}
          {item.categoria ? ` · ${item.categoria}` : ''}
          {falta ? ' · acabando' : ''}
        </span>
      </Link>

      {/* Ajuste rápido da quantidade. */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => mudar(-1)}
          disabled={ajustar.isPending || item.quantidade <= 0}
          aria-label={`Diminuir ${item.nome}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-xl font-bold text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
        >
          −
        </button>
        <span className="w-8 text-center font-bold tabular-nums text-slate-900 dark:text-slate-50">
          {formatQtd(item.quantidade)}
        </span>
        <button
          type="button"
          onClick={() => mudar(1)}
          disabled={ajustar.isPending}
          aria-label={`Aumentar ${item.nome}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-xl font-bold text-brand-700 disabled:opacity-40 dark:border-slate-600"
        >
          +
        </button>
      </div>
    </div>
  )
}
