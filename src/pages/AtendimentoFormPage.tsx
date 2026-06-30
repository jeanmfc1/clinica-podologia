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

// Foto escolhida mas ainda não enviada (fica em espera até salvar).
type FotoPendente = {
  localId: string
  file: File
  momento: 'antes' | 'depois'
  preview: string
}

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
  const [pendentes, setPendentes] = useState<FotoPendente[]>([])
  const [salvando, setSalvando] = useState(false)
  const inputCamera = useRef<HTMLInputElement>(null)
  const inputGaleria = useRef<HTMLInputElement>(null)

  // Escolher fotos: ficam em espera (com preview) até salvar o atendimento.
  function aoEscolherFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!arquivos.length) return
    setPendentes((lista) => [
      ...lista,
      ...arquivos.map((file) => ({
        localId: crypto.randomUUID(),
        file,
        momento,
        preview: URL.createObjectURL(file),
      })),
    ])
  }

  function removerPendente(localId: string) {
    setPendentes((lista) => {
      const alvo = lista.find((p) => p.localId === localId)
      if (alvo) URL.revokeObjectURL(alvo.preview)
      return lista.filter((p) => p.localId !== localId)
    })
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
    setSalvando(true)
    try {
      // 1) Cria ou atualiza o atendimento (e descobre o id + a clínica).
      let atendimentoId = atId
      let clinicaId = atendimento?.clinica_id
      if (editando) {
        await atualizar.mutateAsync({
          id: atId!,
          input: { data: dataHora, evolucao: evolucao.trim() },
        })
      } else {
        const novo = await criar.mutateAsync({
          paciente_id: id,
          agendamento_id: agendamentoId,
          data: dataHora,
          evolucao: evolucao.trim(),
        })
        atendimentoId = novo.id
        clinicaId = novo.clinica_id
      }

      // 2) Envia as fotos que estavam em espera.
      if (atendimentoId && clinicaId) {
        for (const p of pendentes) {
          await enviarFoto.mutateAsync({
            clinicaId,
            atendimentoId,
            file: p.file,
            momento: p.momento,
          })
        }
      }
      pendentes.forEach((p) => URL.revokeObjectURL(p.preview))
      navigate(`/pacientes/${id}`, { replace: true })
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  async function aoExcluir() {
    if (!confirm('Excluir este atendimento?')) return
    await excluir.mutateAsync(atId!)
    navigate(`/pacientes/${id}`, { replace: true })
  }

  const pendAntes = pendentes.filter((p) => p.momento === 'antes')
  const pendDepois = pendentes.filter((p) => p.momento === 'depois')

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
            rows={6}
            value={evolucao}
            onChange={(e) => setEvolucao(e.target.value)}
            placeholder="Descreva o atendimento: queixa, procedimento realizado, orientações…"
            className={inputClass + ' py-2'}
          />
        </Campo>

        {/* Fotos — escolhidas aqui e enviadas junto ao salvar. */}
        <div>
          <p className="mb-1 font-bold text-slate-700">Fotos</p>
          <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
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

          {/* Câmera (tira na hora) */}
          <input
            ref={inputCamera}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={aoEscolherFotos}
            className="hidden"
          />
          {/* Galeria (escolhe arquivos já salvos) */}
          <input
            ref={inputGaleria}
            type="file"
            accept="image/*"
            multiple
            onChange={aoEscolherFotos}
            className="hidden"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => inputCamera.current?.click()}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-400 px-3 font-bold text-brand-700"
            >
              📷 Câmera
            </button>
            <button
              type="button"
              onClick={() => inputGaleria.current?.click()}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-400 px-3 font-bold text-brand-700"
            >
              🖼️ Galeria
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">Adicionando em: {momento}</p>

          {/* Em espera (ainda não enviadas) */}
          <PendentesGaleria titulo="Antes (a enviar)" fotos={pendAntes} aoRemover={removerPendente} />
          <PendentesGaleria titulo="Depois (a enviar)" fotos={pendDepois} aoRemover={removerPendente} />

          {/* Já salvas (modo edição) */}
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

function PendentesGaleria({
  titulo,
  fotos,
  aoRemover,
}: {
  titulo: string
  fotos: FotoPendente[]
  aoRemover: (localId: string) => void
}) {
  if (fotos.length === 0) return null
  return (
    <div className="mt-3">
      <h3 className="mb-2 text-sm font-bold text-amber-600">{titulo}</h3>
      <div className="grid grid-cols-3 gap-2">
        {fotos.map((f) => (
          <div key={f.localId} className="relative">
            <img
              src={f.preview}
              alt={titulo}
              className="aspect-square w-full rounded-lg object-cover ring-2 ring-amber-300"
            />
            <button
              type="button"
              onClick={() => aoRemover(f.localId)}
              aria-label="Remover foto"
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
    <div className="mt-3">
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
