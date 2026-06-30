import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CATEGORIAS,
  FORMAS,
  useAtualizarPagamento,
  useCriarPagamento,
  useExcluirPagamento,
  usePagamento,
} from '../features/financeiro/api'
import { usePacientes } from '../features/pacientes/api'
import type { FormaPagamento, StatusPagamento, TipoLancamento } from '../lib/types'
import { combinarDataHora, dataLocalISO, hojeISO } from '../lib/format'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'
import { DateInputBR } from '../components/DateInputBR'

function parseValor(txt: string): number {
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

  const [tipo, setTipo] = useState<TipoLancamento>('entrada')
  const [valor, setValor] = useState(params.get('valor') || '')
  const [categoria, setCategoria] = useState('')
  const [forma, setForma] = useState<FormaPagamento>('dinheiro')
  const [status, setStatus] = useState<StatusPagamento>('pago')
  const [vencimento, setVencimento] = useState('')
  const [data, setData] = useState(hojeISO())
  const [pacienteId, setPacienteId] = useState(params.get('paciente') || '')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const agendamentoId = params.get('agendamento')

  useEffect(() => {
    if (pagamento) {
      setTipo(pagamento.tipo)
      setValor(String(pagamento.valor).replace('.', ','))
      setCategoria(pagamento.categoria ?? '')
      setForma(pagamento.forma)
      setStatus(pagamento.status)
      setVencimento(pagamento.vencimento ?? '')
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
      tipo,
      valor: v,
      categoria: categoria.trim() || null,
      forma,
      status,
      vencimento: status === 'pendente' ? vencimento || null : null,
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
    if (!confirm('Excluir este lançamento?')) return
    await excluir.mutateAsync(id!)
    navigate('/financeiro', { replace: true })
  }

  const salvando = criar.isPending || atualizar.isPending
  const entrada = tipo === 'entrada'

  return (
    <section>
      <PageHeader titulo={editando ? 'Editar lançamento' : 'Novo lançamento'} voltar />

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        {/* Entrada ou saída */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          {(
            [
              ['entrada', 'Entrada (entrou)'],
              ['saida', 'Saída (gasto)'],
            ] as [TipoLancamento, string][]
          ).map(([t, rotulo]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={
                'min-h-[44px] rounded-md font-bold ' +
                (tipo === t
                  ? t === 'entrada'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'bg-white text-red-700 shadow-sm'
                  : 'text-slate-500')
              }
            >
              {rotulo}
            </button>
          ))}
        </div>

        <Campo rotulo="Valor (R$) *">
          <input
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Categoria">
          <input
            list="categorias-lista"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder={entrada ? 'Ex.: Consulta, Produto…' : 'Ex.: Material, Aluguel…'}
            className={inputClass}
          />
          <datalist id="categorias-lista">
            {CATEGORIAS[tipo].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
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

        {/* Pago ou fiado */}
        <Campo rotulo="Situação">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                ['pago', entrada ? 'Recebido' : 'Pago'],
                ['pendente', entrada ? 'Fiado (a receber)' : 'A pagar'],
              ] as [StatusPagamento, string][]
            ).map(([s, rotulo]) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={
                  'min-h-[44px] rounded-md font-bold ' +
                  (status === s ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500')
                }
              >
                {rotulo}
              </button>
            ))}
          </div>
        </Campo>

        {status === 'pendente' && (
          <Campo rotulo={entrada ? 'Data pra receber' : 'Data pra pagar'}>
            <DateInputBR value={vencimento} onChange={setVencimento} className={inputClass} />
          </Campo>
        )}

        <Campo rotulo="Data do lançamento">
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
            placeholder="Observação…"
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
            Excluir lançamento
          </button>
        )}
      </form>
    </section>
  )
}
