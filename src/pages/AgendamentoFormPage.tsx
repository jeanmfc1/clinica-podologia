import { useEffect, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  salvarProcedimentosDaConsulta,
  useAgendamento,
  useAtualizarAgendamento,
  useCriarAgendamento,
  useExcluirAgendamento,
  useMudarStatus,
} from '../features/agenda/api'
import { usePacientes } from '../features/pacientes/api'
import { useProcedimentos } from '../features/procedimentos/api'
import { STATUS_INFO, STATUS_LISTA } from '../features/agenda/status'
import { linkLembrete } from '../features/agenda/lembrete'
import type { ItemConsulta, StatusAgendamento } from '../lib/types'
import {
  combinarDataHora,
  dataLocalISO,
  formatReal,
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

  const qc = useQueryClient()
  const { data: agendamento } = useAgendamento(id)
  const { data: pacientes } = usePacientes('')
  const { data: procedimentos } = useProcedimentos()
  const criar = useCriarAgendamento()
  const atualizar = useAtualizarAgendamento()
  const excluir = useExcluirAgendamento()
  const mudarStatus = useMudarStatus()

  const [pacienteId, setPacienteId] = useState(params.get('paciente') || '')
  const [itens, setItens] = useState<ItemConsulta[]>([])
  const [procSelId, setProcSelId] = useState('')
  const [data, setData] = useState(params.get('dia') || hojeISO())
  const [hora, setHora] = useState('09:00')
  const [status, setStatus] = useState<StatusAgendamento>('agendado')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  // Preenche ao editar.
  useEffect(() => {
    if (agendamento) {
      setPacienteId(agendamento.paciente_id ?? '')
      // Procedimentos: usa a lista nova; se vier vazia (consulta antiga), cai
      // no procedimento único.
      if (agendamento.itens && agendamento.itens.length > 0) {
        setItens(agendamento.itens)
      } else if (agendamento.procedimento_id && agendamento.procedimento) {
        setItens([
          {
            procedimento_id: agendamento.procedimento_id,
            nome: agendamento.procedimento.nome,
            preco: agendamento.procedimento.preco,
            duracao_min: 30,
          },
        ])
      }
      setData(dataLocalISO(agendamento.inicio))
      setHora(horaLocal(agendamento.inicio))
      setStatus(agendamento.status)
      setObservacao(agendamento.observacao ?? '')
    }
  }, [agendamento])

  const ativos = (procedimentos ?? []).filter((p) => p.ativo)
  const duracaoTotal = itens.reduce((s, i) => s + i.duracao_min, 0) || 30
  const precoTotal = itens.reduce((s, i) => s + i.preco, 0)

  function adicionarProc() {
    const p = (procedimentos ?? []).find((x) => x.id === procSelId)
    if (!p) return
    setItens((l) => [
      ...l,
      { procedimento_id: p.id, nome: p.nome, preco: p.preco, duracao_min: p.duracao_min },
    ])
    setProcSelId('')
  }
  function removerProc(i: number) {
    setItens((l) => l.filter((_, idx) => idx !== i))
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!pacienteId) return setErro('Escolha o paciente.')
    if (!data || !hora) return setErro('Informe a data e a hora.')

    const inicio = combinarDataHora(data, hora)
    const fim = new Date(new Date(inicio).getTime() + duracaoTotal * 60000).toISOString()
    const input = {
      paciente_id: pacienteId,
      procedimento_id: itens[0]?.procedimento_id ?? null, // principal = 1º
      inicio,
      fim,
      status,
      observacao: observacao || null,
    }
    try {
      let agId = id
      if (editando) {
        await atualizar.mutateAsync({ id: id!, input })
      } else {
        const novo = await criar.mutateAsync(input)
        agId = novo.id
      }
      if (agId) await salvarProcedimentosDaConsulta(agId, itens)
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
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

        <div>
          <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">Procedimentos</p>
          <div className="flex items-end gap-2">
            <select
              value={procSelId}
              onChange={(e) => setProcSelId(e.target.value)}
              className={inputClass}
            >
              <option value="">Adicionar procedimento…</option>
              {ativos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.duracao_min} min · {formatReal(p.preco)})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={adicionarProc}
              disabled={!procSelId}
              className="min-h-[48px] shrink-0 rounded-lg border-2 border-brand-600 px-4 font-bold text-brand-700 disabled:opacity-40"
            >
              + Add
            </button>
          </div>
          {itens.length > 0 && (
            <ul className="mt-2 flex flex-col gap-2">
              {itens.map((it, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                >
                  <span className="min-w-0 text-sm">
                    <b className="text-slate-800 dark:text-slate-100">{it.nome}</b>{' '}
                    <span className="text-slate-500 dark:text-slate-400">
                      · {it.duracao_min} min · {formatReal(it.preco)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removerProc(i)}
                    aria-label={`Remover ${it.nome}`}
                    className="shrink-0 text-red-600"
                  >
                    ×
                  </button>
                </li>
              ))}
              <li className="flex justify-between px-1 text-sm font-bold">
                <span className="text-slate-500 dark:text-slate-400">Total</span>
                <span className="text-brand-700">
                  {duracaoTotal} min · {formatReal(precoTotal)}
                </span>
              </li>
            </ul>
          )}
        </div>

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

        {editando && agendamento && linkLembrete(agendamento) && (
          <a
            href={linkLembrete(agendamento)!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 font-bold text-white"
          >
            💬 Lembrar no WhatsApp
          </a>
        )}

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
            to={`/financeiro/novo?agendamento=${id}${pacienteId ? `&paciente=${pacienteId}` : ''}${precoTotal > 0 ? `&valor=${precoTotal}` : ''}`}
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
