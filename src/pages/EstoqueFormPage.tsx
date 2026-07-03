import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CATEGORIAS_ESTOQUE,
  UNIDADES,
  useAtualizarItem,
  useCriarItem,
  useExcluirItem,
  useItemEstoque,
} from '../features/estoque/api'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'

// '3,5' ou '3.5' -> 3.5 ; vazio -> 0.
function paraNumero(texto: string): number {
  return parseFloat(texto.replace(/\./g, '').replace(',', '.')) || 0
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
  const [unidade, setUnidade] = useState('un')
  const [quantidade, setQuantidade] = useState('0')
  const [minimo, setMinimo] = useState('0')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setNome(item.nome)
      setCategoria(item.categoria ?? '')
      setUnidade(item.unidade)
      setQuantidade(String(item.quantidade).replace('.', ','))
      setMinimo(String(item.minimo).replace('.', ','))
      setObservacao(item.observacao ?? '')
    }
  }, [item])

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!nome.trim()) return setErro('Dê um nome ao material.')
    const input = {
      nome: nome.trim(),
      categoria: categoria.trim() || null,
      unidade: unidade || 'un',
      quantidade: paraNumero(quantidade),
      minimo: paraNumero(minimo),
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

        <div className="flex gap-3">
          <div className="flex-1">
            <Campo rotulo="Quantidade">
              <input
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className={inputClass}
              />
            </Campo>
          </div>
          <div className="w-28">
            <Campo rotulo="Unidade">
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

        <Campo rotulo="Avisar quando chegar em (mínimo)">
          <input
            inputMode="decimal"
            value={minimo}
            onChange={(e) => setMinimo(e.target.value)}
            className={inputClass}
          />
        </Campo>
        <p className="-mt-2 text-sm text-slate-500 dark:text-slate-400">
          Quando a quantidade ficar igual ou abaixo desse número, o material
          aparece como “acabando”. Deixe 0 pra não avisar.
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
    </section>
  )
}
