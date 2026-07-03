import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  estaFaltando,
  useAjustarQuantidade,
  useEstoque,
  useLotesAbertos,
  useSeedEstoque,
} from '../features/estoque/api'
import { INVENTARIO_INICIAL } from '../features/estoque/inventarioInicial'
import type { ItemEstoque, Lote } from '../lib/types'
import { Aviso, PageHeader } from '../components/ui'

// Mostra número inteiro quando não tem casas; senão, com vírgula.
function formatQtd(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR')
}

export function EstoquePage() {
  const { data: lista, isLoading, isError } = useEstoque()
  const { data: lotesAbertos } = useLotesAbertos()
  const seed = useSeedEstoque()
  const [erroSeed, setErroSeed] = useState<string | null>(null)
  const faltando = (lista ?? []).filter(estaFaltando)

  async function carregarInventario() {
    setErroSeed(null)
    try {
      await seed.mutateAsync(INVENTARIO_INICIAL)
    } catch {
      setErroSeed('Não foi possível carregar o inventário. Tente de novo.')
    }
  }

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
        <div className="flex flex-col gap-4">
          <Aviso>
            Nenhum material cadastrado ainda. Carregue o inventário da Pés de Anjo
            ou toque em <b>+ Novo</b> pra adicionar um por um.
          </Aviso>
          <button
            onClick={carregarInventario}
            disabled={seed.isPending}
            className="min-h-[48px] rounded-lg bg-brand-700 px-4 font-bold text-white disabled:opacity-60"
          >
            {seed.isPending
              ? 'Carregando…'
              : `Carregar inventário da Pés de Anjo (${INVENTARIO_INICIAL.length} itens)`}
          </button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Cadastra seus materiais com as quantidades atuais. Você pode editar
            tudo depois (inclusive o mínimo pra avisar).
          </p>
          {erroSeed && (
            <p role="alert" className="text-center font-bold text-red-700">
              {erroSeed}
            </p>
          )}
        </div>
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
              <ItemLinha
                item={item}
                lote={lotesAbertos?.[item.id]}
                formatQtd={formatQtd}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ItemLinha({
  item,
  lote,
  formatQtd,
}: {
  item: ItemEstoque
  lote?: Lote
  formatQtd: (n: number) => string
}) {
  const ajustar = useAjustarQuantidade()
  const falta = estaFaltando(item)
  const ehLote = item.tipo === 'lote'

  function mudar(delta: number) {
    ajustar.mutate({ id: item.id, atual: item.quantidade, delta })
  }

  // Subtítulo: itens de lote mostram o frasco aberto e a reserva.
  const subtitulo = ehLote
    ? (lote
        ? `frasco aberto: ${formatQtd(lote.usos)} uso${lote.usos === 1 ? '' : 's'}`
        : 'sem frasco aberto') +
      ` · reserva: ${formatQtd(item.quantidade)}`
    : `${formatQtd(item.quantidade)} ${item.unidade}`

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
          {subtitulo}
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
