import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePaciente } from '../features/pacientes/api'
import {
  ANAMNESE_SIM_NAO,
  ANAMNESE_TEXTO,
  useAnamnese,
  useSalvarAnamnese,
} from '../features/prontuario/api'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'

export function AnamneseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: paciente } = usePaciente(id)
  const { data: anamnese, isLoading } = useAnamnese(id)
  const salvar = useSalvarAnamnese()

  const [respostas, setRespostas] = useState<Record<string, unknown>>({})
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (anamnese) setRespostas(anamnese.respostas_json ?? {})
  }, [anamnese])

  function setSimNao(chave: string, valor: boolean) {
    setRespostas((r) => ({ ...r, [chave]: valor }))
  }
  function setTexto(chave: string, valor: string) {
    setRespostas((r) => ({ ...r, [chave]: valor }))
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!id) return setErro('Paciente não identificado.')
    try {
      await salvar.mutateAsync({ pacienteId: id, respostas })
      navigate(`/pacientes/${id}`, { replace: true })
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    }
  }

  return (
    <section>
      <PageHeader titulo="Anamnese" voltar />

      {paciente && (
        <p className="mb-4 text-slate-600 dark:text-slate-300">
          Paciente: <span className="font-bold text-slate-800 dark:text-slate-100">{paciente.nome}</span>
        </p>
      )}

      {isLoading ? (
        <p className="text-slate-500 dark:text-slate-400">Carregando…</p>
      ) : (
        <form onSubmit={aoEnviar} className="flex flex-col gap-5">
          <div>
            <h2 className="mb-2 font-bold text-slate-800 dark:text-slate-100">Histórico de saúde</h2>
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {ANAMNESE_SIM_NAO.map((q) => {
                const marcado = respostas[q.chave] === true
                return (
                  <label
                    key={q.chave}
                    className="flex min-h-[48px] cursor-pointer items-center justify-between px-4"
                  >
                    <span className="text-slate-700 dark:text-slate-200">{q.rotulo}</span>
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={(e) => setSimNao(q.chave, e.target.checked)}
                      className="h-6 w-6 accent-brand-600"
                    />
                  </label>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Marque o que se aplica ao paciente.</p>
          </div>

          {ANAMNESE_TEXTO.map((q) => (
            <Campo key={q.chave} rotulo={q.rotulo}>
              <textarea
                rows={2}
                value={(respostas[q.chave] as string) ?? ''}
                onChange={(e) => setTexto(q.chave, e.target.value)}
                className={inputClass + ' py-2'}
              />
            </Campo>
          ))}

          {erro && (
            <p role="alert" className="font-bold text-red-700">
              {erro}
            </p>
          )}

          <BotaoPrimario type="submit" disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar anamnese'}
          </BotaoPrimario>
        </form>
      )}
    </section>
  )
}
