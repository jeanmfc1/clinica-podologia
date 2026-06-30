import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  useAtendimento,
  useAtualizarAtendimento,
  useCriarAtendimento,
  useExcluirAtendimento,
  useEnviarFoto,
  useExcluirFoto,
  useFotosDoAtendimento,
  type FotoComUrl,
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
  const { data: fotos } = useFotosDoAtendimento(atId)
  const enviarFoto = useEnviarFoto()
  const excluirFoto = useExcluirFoto()

  const agora = new Date()
  const [data, setData] = useState(hojeISO())
  const [hora, setHora] = useState(
    `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`,
  )
  const [evolucao, setEvolucao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [momento, setMomento] = useState<'antes' | 'depois'>('antes')
  const inputFoto = useRef<HTMLInputElement>(null)

  async function aoEscolherFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    e.target.value = '' // permite reenviar o mesmo arquivo depois
    if (!arquivos.length || !atId || !atendimento) return
    try {
      for (const file of arquivos) {
        await enviarFoto.mutateAsync({
          clinicaId: atendimento.clinica_id,
          atendimentoId: atId,
          file,
          momento,
        })
      }
    } catch {
      setErro('Não foi possível enviar a foto. Tente de novo.')
    }
  }

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

      {/* Fotos antes/depois — só depois do atendimento existir (modo edição). */}
      {editando ? (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-bold text-slate-800">Fotos</h2>

          {/* Escolha antes/depois antes de tirar/enviar a foto. */}
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            {(['antes', 'depois'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMomento(m)}
                className={
                  'min-h-[40px] rounded-md font-bold capitalize ' +
                  (momento === m ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500')
                }
              >
                {m}
              </button>
            ))}
          </div>

          <input
            ref={inputFoto}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={aoEscolherFotos}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputFoto.current?.click()}
            disabled={enviarFoto.isPending}
            className="mb-4 flex min-h-[48px] w-full items-center justify-center rounded-lg border-2 border-dashed border-brand-400 px-4 font-bold text-brand-700"
          >
            {enviarFoto.isPending ? 'Enviando…' : `+ Adicionar foto (${momento})`}
          </button>

          <GaleriaFotos
            titulo="Antes"
            fotos={(fotos ?? []).filter((f) => f.momento === 'antes')}
            aoExcluir={(f) => {
              if (confirm('Excluir esta foto?')) excluirFoto.mutate(f)
            }}
          />
          <GaleriaFotos
            titulo="Depois"
            fotos={(fotos ?? []).filter((f) => f.momento === 'depois')}
            aoExcluir={(f) => {
              if (confirm('Excluir esta foto?')) excluirFoto.mutate(f)
            }}
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          Salve o atendimento para poder adicionar fotos.
        </p>
      )}
    </section>
  )
}

function GaleriaFotos({
  titulo,
  fotos,
  aoExcluir,
}: {
  titulo: string
  fotos: FotoComUrl[]
  aoExcluir: (f: FotoComUrl) => void
}) {
  if (fotos.length === 0) return null
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-sm font-bold text-slate-500">{titulo}</h3>
      <div className="grid grid-cols-3 gap-2">
        {fotos.map((f) => (
          <div key={f.id} className="relative">
            {f.url ? (
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={f.url}
                  alt={titulo}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </a>
            ) : (
              <div className="aspect-square w-full rounded-lg bg-slate-100" />
            )}
            <button
              type="button"
              onClick={() => aoExcluir(f)}
              aria-label="Excluir foto"
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
