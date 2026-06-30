import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  useAgendamento,
  useAtualizarAgendamento,
  useCriarAgendamento,
  useExcluirAgendamento,
  useMudarStatus,
} from '../features/agenda/api'
import { usePacientes } from '../features/pacientes/api'
import { useProcedimentos } from '../features/procedimentos/api'
import { STATUS_INFO, STATUS_LISTA } from '../features/agenda/status'
import type { StatusAgendamento } from '../lib/types'
import {
  combinarDataHora,
  dataLocalISO,
  horaLocal,
  hojeISO,
} from '../lib/format'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'
import { DateInputBR } from '../components/DateInputBR'

export function AgendamentoFormPage() {
  const { id } = useParams()
  const editando = !!id
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const { data: agendamento } = useAgendamento(id)
  const { data: pacientes } = usePacientes('')
  const { data: procedimentos } = useProcedimentos()
  const criar = useCriarAgendamento()
  const atualizar = useAtualizarAgendamento()
  const excluir = useExcluirAgendamento()
  const mudarStatus = useMudarStatus()

  const [pacienteId, setPacienteId] = useState(params.get('paciente') || '')
  const [procedimentoId, setProcedimentoId] = useState('')
  const [data, setData] = useState(params.get('dia') || hojeISO())
  const [hora, setHora] = useState('09:00')
  const [status, setStatus] = useState<StatusAgendamento>('agendado')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  // Preenche ao editar.
  useEffect(() => {
    if (agendamento) {
      setPacienteId(agendamento.paciente_id ?? '')
      setProcedimentoId(agendamento.procedimento_id ?? '')
      setData(dataLocalISO(agendamento.inicio))
      setHora(horaLocal(agendamento.inicio))
      setStatus(agendamento.status)
      setObservacao(agendamento.observacao ?? '')
    }
  }, [agendamento])

  // Procedimentos ativos (sempre inclui o já escolhido, mesmo se inativo).
  const opcoesProc = useMemo(() => {
    const todos = procedimentos ?? []
    return todos.filter((p) => p.ativo || p.id === procedimentoId)
  }, [procedimentos, procedimentoId])

  const procEscolhido = procedimentos?.find((p) => p.id === procedimentoId)
  const duracao = procEscolhido?.duracao_min ?? 30

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!pacienteId) return setErro('Escolha o paciente.')
    if (!data || !hora) return setErro('Informe a data e a hora.')

    const inicio = combinarDataHora(data, hora)
    const fim = new Date(new Date(inicio).getTime() + duracao * 60000).toISOString()
    const input = {
      paciente_id: pacienteId,
      procedimento_id: procedimentoId || null,
      inicio,
      fim,
      status,
      observacao: observacao || null,
    }
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: id!, input })
      } else {
        await criar.mutateAsync(input)
      }
      // Volta para a agenda já no dia da consulta.
      navigate(`/agenda?dia=${data}`, { replace: true })
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    }
  }

  async function aoExcluir() {
    if (!confirm('Excluir esta consulta?')) return
    await excluir.mutateAsync(id!)
    navigate('/agenda', { replace: true })
  }

  // Confirma a consulta num toque (também envia pro Google).
  async function aoConfirmar() {
    await mudarStatus.mutateAsync({ id: id!, status: 'confirmado' })
    setStatus('confirmado')
    navigate(`/agenda?dia=${data}`, { replace: true })
  }

  const salvando = criar.isPending || atualizar.isPending

  return (
    <section>
      <PageHeader titulo={editando ? 'Editar consulta' : 'Nova consulta'} voltar />

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Campo rotulo="Paciente *">
          <select
            value={pacienteId}
            onChange={(e) => setPacienteId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione…</option>
            {pacientes?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="Procedimento">
          <select
            value={procedimentoId}
            onChange={(e) => setProcedimentoId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione…</option>
            {opcoesProc.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.duracao_min} min)
              </option>
            ))}
          </select>
        </Campo>

        <div className="flex gap-3">
          <div className="flex-1">
            <Campo rotulo="Data">
              <DateInputBR value={data} onChange={setData} className={inputClass} />
            </Campo>
          </div>
          <div className="w-28">
            <Campo rotulo="Hora">
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={inputClass}
              />
            </Campo>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Duração: {duracao} min{procEscolhido ? '' : ' (escolha o procedimento)'}
        </p>

        <Campo rotulo="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusAgendamento)}
            className={inputClass}
          >
            {STATUS_LISTA.map((s) => (
              <option key={s} value={s}>
                {STATUS_INFO[s].rotulo}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="Observação">
          <textarea
            rows={2}
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

        {editando && status === 'agendado' && (
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={mudarStatus.isPending}
            className="flex min-h-[48px] items-center justify-center rounded-lg bg-green-600 px-4 font-bold text-white"
          >
            {mudarStatus.isPending ? 'Confirmando…' : '✓ Confirmar consulta'}
          </button>
        )}

        <BotaoPrimario type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </BotaoPrimario>

        {editando && pacienteId && (
          <Link
            to={`/pacientes/${pacienteId}/atendimentos/novo?agendamento=${id}`}
            className="flex min-h-[48px] items-center justify-center rounded-lg border-2 border-brand-600 px-4 font-bold text-brand-700"
          >
            Atender (registrar evolução)
          </Link>
        )}

        {editando && (
          <Link
            to={`/financeiro/novo?agendamento=${id}${pacienteId ? `&paciente=${pacienteId}` : ''}${procEscolhido ? `&valor=${procEscolhido.preco}` : ''}`}
            className="flex min-h-[48px] items-center justify-center rounded-lg border-2 border-green-600 px-4 font-bold text-green-700"
          >
            Registrar pagamento
          </Link>
        )}

        {editando && (
          <button
            type="button"
            onClick={aoExcluir}
            className="min-h-[44px] rounded-lg border border-red-300 px-4 font-bold text-red-700"
          >
            Excluir consulta
          </button>
        )}
      </form>
    </section>
  )
}
