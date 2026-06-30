import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useAtualizarProcedimento,
  useCriarProcedimento,
  useExcluirProcedimento,
  useProcedimento,
} from '../features/procedimentos/api'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'

export function ProcedimentoFormPage() {
  const { id } = useParams()
  const editando = !!id
  const navigate = useNavigate()

  const { data: proc } = useProcedimento(id)
  const criar = useCriarProcedimento()
  const atualizar = useAtualizarProcedimento()
  const excluir = useExcluirProcedimento()

  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('') // texto, aceita vírgula
  const [duracao, setDuracao] = useState('90')
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (proc) {
      setNome(proc.nome)
      setPreco(String(proc.preco).replace('.', ','))
      setDuracao(String(proc.duracao_min))
      setAtivo(proc.ativo)
    }
  }, [proc])

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    const precoNum = parseFloat(preco.replace(/\./g, '').replace(',', '.')) || 0
    const duracaoNum = parseInt(duracao, 10) || 0
    const input = { nome: nome.trim(), preco: precoNum, duracao_min: duracaoNum, ativo }
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: id!, input })
      } else {
        await criar.mutateAsync(input)
      }
      navigate('/procedimentos', { replace: true })
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    }
  }

  async function aoExcluir() {
    if (!confirm(`Excluir o procedimento "${nome}"?`)) return
    await excluir.mutateAsync(id!)
    navigate('/procedimentos', { replace: true })
  }

  const salvando = criar.isPending || atualizar.isPending

  return (
    <section>
      <PageHeader titulo={editando ? 'Editar procedimento' : 'Novo procedimento'} voltar />

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Campo rotulo="Nome *">
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Preço (R$)">
          <input
            inputMode="decimal"
            placeholder="0,00"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Duração (minutos)">
          <input
            type="number"
            inputMode="numeric"
            min={5}
            step={5}
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
            className={inputClass}
          />
        </Campo>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-5 w-5"
          />
          <span className="font-bold text-slate-700 dark:text-slate-200">
            Ativo (aparece ao marcar consulta)
          </span>
        </label>

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
