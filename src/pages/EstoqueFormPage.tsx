import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CATEGORIAS_ESTOQUE,
  UNIDADES,
  useAbrirLote,
  useAtualizarItem,
  useCriarItem,
  useExcluirItem,
  useFecharLote,
  useItemEstoque,
  useLotesDoItem,
} from '../features/estoque/api'
import type { ItemEstoque, Lote, TipoEstoque } from '../lib/types'
import { formatData } from '../lib/format'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'

// '3,5' ou '3.5' -> 3.5 ; vazio -> 0.
function paraNumero(texto: string): number {
  return parseFloat(texto.replace(/\./g, '').replace(',', '.')) || 0
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR')
}

export function EstoqueFormPage() {
  const { id } = useParams()
  const editando = !!id
  const navigate = useNavigate()

  const { data: item } = useItemEstoque(id)
  const criar = useCriarItem()
  const atualizar = useAtualizarItem()
  const excluir = useExcluirItem()

  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [tipo, setTipo] = useState<TipoEstoque>('unidade')
  const [unidade, setUnidade] = useState('un')
  const [tamanhoLote, setTamanhoLote] = useState('')
  const [quantidade, setQuantidade] = useState('0')
  const [minimo, setMinimo] = useState('0')
  const [preco, setPreco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setNome(item.nome)
      setCategoria(item.categoria ?? '')
      setTipo(item.tipo)
      setUnidade(item.unidade)
      setTamanhoLote(item.tamanho_lote != null ? String(item.tamanho_lote).replace('.', ',') : '')
      setQuantidade(String(item.quantidade).replace('.', ','))
      setMinimo(String(item.minimo).replace('.', ','))
      setPreco(item.preco ? String(item.preco).replace('.', ',') : '')
      setObservacao(item.observacao ?? '')
    }
  }, [item])

  // Ao virar 'lote', sugere ml como unidade de conteúdo (se ainda for 'un').
  useEffect(() => {
    if (tipo === 'lote' && unidade === 'un') setUnidade('ml')
  }, [tipo]) // eslint-disable-line react-hooks/exhaustive-deps

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!nome.trim()) return setErro('Dê um nome ao material.')
    const input = {
      nome: nome.trim(),
      categoria: categoria.trim() || null,
      tipo,
      unidade: unidade || 'un',
      tamanho_lote: tipo === 'lote' ? paraNumero(tamanhoLote) || null : null,
      quantidade: paraNumero(quantidade),
      minimo: paraNumero(minimo),
      preco: paraNumero(preco),
      observacao: observacao.trim() || null,
    }
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: id!, input })
      } else {
        await criar.mutateAsync(input)
      }
      navigate('/estoque', { replace: true })
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    }
  }

  async function aoExcluir() {
    if (!confirm(`Excluir o material "${nome}"?`)) return
    await excluir.mutateAsync(id!)
    navigate('/estoque', { replace: true })
  }

  const salvando = criar.isPending || atualizar.isPending
  const ehLote = tipo === 'lote'

  return (
    <section>
      <PageHeader titulo={editando ? 'Editar material' : 'Novo material'} voltar />

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Campo rotulo="Nome *">
          <input
            required
            placeholder="Ex.: Lâmina de bisturi nº 15"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Categoria">
          <input
            list="categorias-estoque"
            placeholder="Ex.: Lâminas"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={inputClass}
          />
          <datalist id="categorias-estoque">
            {CATEGORIAS_ESTOQUE.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Campo>

        {/* Como controlar este material. */}
        <div>
          <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">Como controlar</p>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
            {(
              [
                ['unidade', 'Por unidade'],
                ['lote', 'Por lote (líquido/creme)'],
              ] as [TipoEstoque, string][]
            ).map(([t, r]) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={
                  'min-h-[40px] rounded-md px-2 text-sm font-bold ' +
                  (tipo === t ? 'bg-white dark:bg-slate-800 text-brand-700 shadow-sm' : 'text-slate-500 dark:text-slate-400')
                }
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {ehLote
              ? 'Conta quantos usos cada frasco teve; quando acaba, mostra quanto durou.'
              : 'Baixa 1 (ou a quantidade usada) por atendimento.'}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Campo rotulo={ehLote ? 'Frascos de reserva (fechados)' : 'Quantidade'}>
              <input
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className={inputClass}
              />
            </Campo>
          </div>
          <div className="w-28">
            <Campo rotulo={ehLote ? 'Conteúdo' : 'Unidade'}>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className={inputClass}
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        </div>

        {ehLote && (
          <Campo rotulo={`Tamanho de cada frasco (${unidade})`}>
            <input
              inputMode="decimal"
              placeholder="Ex.: 10"
              value={tamanhoLote}
              onChange={(e) => setTamanhoLote(e.target.value)}
              className={inputClass}
            />
          </Campo>
        )}

        <Campo rotulo={ehLote ? 'Avisar quando a reserva chegar em' : 'Avisar quando chegar em (mínimo)'}>
          <input
            inputMode="decimal"
            value={minimo}
            onChange={(e) => setMinimo(e.target.value)}
            className={inputClass}
          />
        </Campo>
        <p className="-mt-2 text-sm text-slate-500 dark:text-slate-400">
          {ehLote
            ? 'Quando os frascos de reserva chegarem nesse número, aparece como “acabando”. Deixe 0 pra não avisar.'
            : 'Quando a quantidade ficar igual ou abaixo desse número, o material aparece como “acabando”. Deixe 0 pra não avisar.'}
        </p>

        <Campo rotulo="Preço de venda (R$)">
          <input
            inputMode="decimal"
            placeholder="0,00"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className={inputClass}
          />
        </Campo>
        <p className="-mt-2 text-sm text-slate-500 dark:text-slate-400">
          Preencha só se você <b>vende</b> este produto. Deixe 0 se for material
          de uso.
        </p>

        <Campo rotulo="Observação">
          <textarea
            rows={2}
            placeholder="Ex.: comprar na fornecedora tal"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className={inputClass + ' py-2'}
          />
        </Campo>

        {erro && (
          <p role="alert" className="font-bold text-red-700">
            {erro}
          </p>
        )}

        <BotaoPrimario type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </BotaoPrimario>

        {editando && (
          <button
            type="button"
            onClick={aoExcluir}
            className="min-h-[44px] rounded-lg border border-red-300 px-4 font-bold text-red-700"
          >
            Excluir
          </button>
        )}
      </form>

      {/* Frascos (lotes) — só pra itens de lote já salvos. */}
      {editando && item && item.tipo === 'lote' && <LotesSecao item={item} />}
    </section>
  )
}

function LotesSecao({ item }: { item: ItemEstoque }) {
  const { data: lotes } = useLotesDoItem(item.id)
  const abrir = useAbrirLote()
  const fechar = useFecharLote()

  const aberto = (lotes ?? []).find((l) => !l.fechado_em)
  const fechados = (lotes ?? []).filter((l) => l.fechado_em)

  return (
    <div className="mt-8">
      <h2 className="mb-2 text-lg font-bold text-slate-800 dark:text-slate-100">Frascos</h2>

      {aberto ? (
        <div className="rounded-lg border border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10 p-3">
          <p className="font-bold text-slate-800 dark:text-slate-100">
            Frasco aberto · {formatNum(aberto.usos)} uso{aberto.usos === 1 ? '' : 's'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aberto em {formatData(aberto.aberto_em)}
            {aberto.tamanho ? ` · ${formatNum(aberto.tamanho)} ${item.unidade}` : ''}
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('Marcar que este frasco acabou?')) fechar.mutate(aberto.id)
            }}
            disabled={fechar.isPending}
            className="mt-2 min-h-[44px] w-full rounded-lg border-2 border-amber-500 px-4 font-bold text-amber-700"
          >
            🔴 Frasco acabou
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            abrir.mutate({ estoqueId: item.id, tamanho: item.tamanho_lote })
          }
          disabled={abrir.isPending}
          className="min-h-[48px] w-full rounded-lg bg-brand-700 px-4 font-bold text-white disabled:opacity-60"
        >
          {abrir.isPending ? 'Abrindo…' : '+ Abrir novo frasco'}
        </button>
      )}

      {fechados.length > 0 && (
        <>
          <h3 className="mb-2 mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">
            Frascos anteriores
          </h3>
          <ul className="flex flex-col gap-2">
            {fechados.map((l) => (
              <li key={l.id}>
                <LoteFechado lote={l} unidade={item.unidade} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function LoteFechado({ lote, unidade }: { lote: Lote; unidade: string }) {
  const dias = lote.fechado_em
    ? Math.max(
        1,
        Math.round(
          (new Date(lote.fechado_em).getTime() - new Date(lote.aberto_em).getTime()) /
            86400000,
        ),
      )
    : null
  const media =
    lote.tamanho && lote.usos > 0 ? lote.tamanho / lote.usos : null

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <p className="font-bold text-slate-800 dark:text-slate-100">
        {formatNum(lote.usos)} uso{lote.usos === 1 ? '' : 's'}
        {dias != null ? ` · durou ${dias} dia${dias === 1 ? '' : 's'}` : ''}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {formatData(lote.aberto_em)} – {formatData(lote.fechado_em)}
        {media != null
          ? ` · média ≈ ${media.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${unidade}/uso`
          : ''}
      </p>
    </div>
  )
}
