import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  FORMAS,
  useAtualizarPagamento,
  useCriarPagamento,
  useExcluirPagamento,
  usePagamento,
} from '../features/financeiro/api'
import { usePacientes } from '../features/pacientes/api'
import type { FormaPagamento } from '../lib/types'
import { combinarDataHora, dataLocalISO, hojeISO } from '../lib/format'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'
import { DateInputBR } from '../components/DateInputBR'

function parseValor(txt: string): number {
  // Aceita "140", "140,50" ou "140.50".
  const limpo = txt.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(limpo)
  return isNaN(n) ? NaN : n
}

export function PagamentoFormPage() {
  const { id } = useParams()
  const editando = !!id
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const { data: pagamento } = usePagamento(id)
  const { data: pacientes } = usePacientes('')
  const criar = useCriarPagamento()
  const atualizar = useAtualizarPagamento()
  const excluir = useExcluirPagamento()

  const [valor, setValor] = useState(params.get('valor') || '')
  const [forma, setForma] = useState<FormaPagamento>('dinheiro')
  const [data, setData] = useState(hojeISO())
  const [pacienteId, setPacienteId] = useState(params.get('paciente') || '')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const agendamentoId = params.get('agendamento')

  useEffect(() => {
    if (pagamento) {
      setValor(String(pagamento.valor).replace('.', ','))
      setForma(pagamento.forma)
      setData(dataLocalISO(pagamento.data))
      setPacienteId(pagamento.paciente_id ?? '')
      setDescricao(pagamento.descricao ?? '')
    }
  }, [pagamento])

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    const v = parseValor(valor)
    if (isNaN(v) || v <= 0) return setErro('Informe um valor válido.')

    const input = {
      valor: v,
      forma,
      data: combinarDataHora(data, '12:00'),
      paciente_id: pacienteId || null,
      descricao: descricao.trim() || null,
      ...(editando ? {} : { agendamento_id: agendamentoId }),
    }
    try {
      if (editando) await atualizar.mutateAsync({ id: id!, input })
      else await criar.mutateAsync(input)
      navigate('/financeiro', { replace: true })
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    }
  }

  async function aoExcluir() {
    if (!confirm('Excluir este pagamento?')) return
    await excluir.mutateAsync(id!)
    navigate('/financeiro', { replace: true })
  }

  const salvando = criar.isPending || atualizar.isPending

  return (
    <section>
      <PageHeader titulo={editando ? 'Editar pagamento' : 'Novo pagamento'} voltar />

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Campo rotulo="Valor (R$) *">
          <input
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Forma de pagamento">
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

        <Campo rotulo="Data">
          <DateInputBR value={data} onChange={setData} className={inputClass} />
        </Campo>

        <Campo rotulo="Paciente (opcional)">
          <select
            value={pacienteId}
            onChange={(e) => setPacienteId(e.target.value)}
            className={inputClass}
          >
            <option value="">— Sem paciente —</option>
            {pacientes?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="Descrição (opcional)">
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: consulta, produto…"
            className={inputClass}
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
            Excluir pagamento
          </button>
        )}
      </form>
    </section>
  )
}
