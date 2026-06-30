import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  useAtendimento,
  useAtualizarAtendimento,
  useCriarAtendimento,
  useExcluirAtendimento,
} from '../features/prontuario/api'
import { usePaciente } from '../features/pacientes/api'
import {
  combinarDataHora,
  dataLocalISO,
  horaLocal,
  hojeISO,
} from '../lib/format'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'
import { DateInputBR } from '../components/DateInputBR'

export function AtendimentoFormPage() {
  const { id, atId } = useParams() // id = paciente; atId = atendimento (ao editar)
  const editando = !!atId
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const agendamentoId = params.get('agendamento')

  const { data: paciente } = usePaciente(id)
  const { data: atendimento } = useAtendimento(atId)
  const criar = useCriarAtendimento()
  const atualizar = useAtualizarAtendimento()
  const excluir = useExcluirAtendimento()

  const agora = new Date()
  const [data, setData] = useState(hojeISO())
  const [hora, setHora] = useState(
    `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`,
  )
  const [evolucao, setEvolucao] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  // Preenche ao editar.
  useEffect(() => {
    if (atendimento) {
      setData(dataLocalISO(atendimento.data))
      setHora(horaLocal(atendimento.data))
      setEvolucao(atendimento.evolucao ?? '')
    }
  }, [atendimento])

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!evolucao.trim()) return setErro('Escreva a evolução do atendimento.')
    if (!id) return setErro('Paciente não identificado.')

    const dataHora = combinarDataHora(data, hora)
    try {
      if (editando) {
        await atualizar.mutateAsync({
          id: atId!,
          input: { data: dataHora, evolucao: evolucao.trim() },
        })
      } else {
        await criar.mutateAsync({
          paciente_id: id,
          agendamento_id: agendamentoId,
          data: dataHora,
          evolucao: evolucao.trim(),
        })
      }
      navigate(`/pacientes/${id}`, { replace: true })
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    }
  }

  async function aoExcluir() {
    if (!confirm('Excluir este atendimento?')) return
    await excluir.mutateAsync(atId!)
    navigate(`/pacientes/${id}`, { replace: true })
  }

  const salvando = criar.isPending || atualizar.isPending

  return (
    <section>
      <PageHeader titulo={editando ? 'Editar atendimento' : 'Novo atendimento'} voltar />

      {paciente && (
        <p className="mb-4 text-slate-600">
          Paciente: <span className="font-bold text-slate-800">{paciente.nome}</span>
        </p>
      )}

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
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

        <Campo rotulo="Evolução / o que foi feito *">
          <textarea
            rows={8}
            value={evolucao}
            onChange={(e) => setEvolucao(e.target.value)}
            placeholder="Descreva o atendimento: queixa, procedimento realizado, orientações…"
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
            Excluir atendimento
          </button>
        )}
      </form>
    </section>
  )
}
