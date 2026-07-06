import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEstoque, useVenderProduto } from '../features/estoque/api'
import { FORMAS } from '../features/financeiro/api'
import { usePacientes } from '../features/pacientes/api'
import type { FormaPagamento, StatusPagamento } from '../lib/types'
import { formatReal } from '../lib/format'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'
import { DateInputBR } from '../components/DateInputBR'

export function VenderProdutoPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: estoque } = useEstoque()
  const { data: pacientes } = usePacientes('')
  const vender = useVenderProduto()

  const produtos = useMemo(
    () => (estoque ?? []).filter((e) => e.preco > 0),
    [estoque],
  )

  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [forma, setForma] = useState<FormaPagamento>('dinheiro')
  const [status, setStatus] = useState<StatusPagamento>('pago')
  const [vencimento, setVencimento] = useState('')
  const [pacienteId, setPacienteId] = useState(params.get('paciente') || '')
  const [erro, setErro] = useState<string | null>(null)

  const produto = produtos.find((p) => p.id === produtoId)
  const qtd = parseInt(quantidade, 10) || 0
  const total = produto ? produto.preco * qtd : 0

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!produto) return setErro('Escolha o produto.')
    if (qtd <= 0) return setErro('Informe a quantidade.')
    if (qtd > produto.quantidade)
      return setErro(`Só há ${produto.quantidade} em estoque.`)
    try {
      await vender.mutateAsync({
        estoqueId: produto.id,
        nome: produto.nome,
        quantidade: qtd,
        valorUnitario: produto.preco,
        forma,
        status,
        pacienteId: pacienteId || null,
        vencimento: vencimento || null,
      })
      navigate('/financeiro', { replace: true })
    } catch {
      setErro('Não foi possível registrar a venda. Tente de novo.')
    }
  }

  return (
    <section>
      <PageHeader titulo="Vender produto" voltar />

      {produtos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-slate-500 dark:text-slate-400">
          Nenhum produto com preço cadastrado. Adicione produtos de venda no
          Estoque (com preço) pra vender aqui.
        </p>
      ) : (
        <form onSubmit={aoEnviar} className="flex flex-col gap-4">
          <Campo rotulo="Produto *">
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione…</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {formatReal(p.preco)} ({p.quantidade} em estoque)
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Quantidade">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className={inputClass}
            />
          </Campo>

          {produto && (
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Total: {formatReal(total)}
            </p>
          )}

          <Campo rotulo="Cliente (opcional)">
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className={inputClass}
            >
              <option value="">Sem cliente</option>
              {pacientes?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Forma">
            <select
              value={forma}
              onChange={(e) => setForma(e.target.value as FormaPagamento)}
              className={inputClass}
            >
              {FORMAS.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.rotulo}
                </option>
              ))}
            </select>
          </Campo>

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
            {(
              [
                ['pago', 'Recebido'],
                ['pendente', 'Fiado (a receber)'],
              ] as [StatusPagamento, string][]
            ).map(([s, r]) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={
                  'min-h-[40px] rounded-md font-bold ' +
                  (status === s ? 'bg-white dark:bg-slate-800 text-brand-700 shadow-sm' : 'text-slate-500 dark:text-slate-400')
                }
              >
                {r}
              </button>
            ))}
          </div>

          {status === 'pendente' && (
            <Campo rotulo="Data pra receber">
              <DateInputBR value={vencimento} onChange={setVencimento} className={inputClass} />
            </Campo>
          )}

          {erro && (
            <p role="alert" className="font-bold text-red-700">
              {erro}
            </p>
          )}

          <BotaoPrimario type="submit" disabled={vender.isPending}>
            {vender.isPending ? 'Registrando…' : `Registrar venda${total ? ' · ' + formatReal(total) : ''}`}
          </BotaoPrimario>
        </form>
      )}
    </section>
  )
}
