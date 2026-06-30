import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { clinica } from '../config'
import { combinarDataHora, formatReal } from '../lib/format'
import {
  ANAMNESE_SIM_NAO,
  ANAMNESE_TEXTO,
} from '../features/prontuario/api'
import {
  buscarOcupados,
  buscarProcedimentos,
  enviarAgendamento,
  filtrarLivres,
  gerarSlots,
  type ProcedimentoPublico,
} from '../lib/agendarPublico'
import { BotaoPrimario, Campo, inputClass } from '../components/ui'
import { DateInputBR } from '../components/DateInputBR'
import { TelefoneInput } from '../components/TelefoneInput'

export function AgendarPublicoPage() {
  const [procedimentos, setProcedimentos] = useState<ProcedimentoPublico[]>([])
  const [procId, setProcId] = useState('')
  const [data, setData] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState('')
  const [carregandoSlots, setCarregandoSlots] = useState(false)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [documento, setDocumento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [respostas, setRespostas] = useState<Record<string, unknown>>({})
  const [confirmo, setConfirmo] = useState(false)

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const proc = useMemo(() => procedimentos.find((p) => p.id === procId), [procedimentos, procId])
  const duracao = proc?.duracao_min ?? 0

  useEffect(() => {
    buscarProcedimentos()
      .then(setProcedimentos)
      .catch(() => setErro('Não foi possível carregar os serviços. Tente recarregar a página.'))
  }, [])

  // Quando muda serviço ou dia, recalcula os horários livres.
  useEffect(() => {
    setSlot('')
    if (!procId || !data || !duracao) {
      setSlots([])
      return
    }
    const candidatos = gerarSlots(data, duracao)
    if (candidatos.length === 0) {
      setSlots([])
      return
    }
    setCarregandoSlots(true)
    const ini = new Date(`${data}T00:00:00`)
    const fim = new Date(ini)
    fim.setDate(fim.getDate() + 1)
    buscarOcupados(ini.toISOString(), fim.toISOString())
      .then((ocupados) => setSlots(filtrarLivres(data, candidatos, duracao, ocupados)))
      .catch(() => setSlots(candidatos))
      .finally(() => setCarregandoSlots(false))
  }, [procId, data, duracao])

  function setSimNao(chave: string, v: boolean) {
    setRespostas((r) => ({ ...r, [chave]: v }))
  }
  function setTexto(chave: string, v: string) {
    setRespostas((r) => ({ ...r, [chave]: v }))
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!procId) return setErro('Escolha o serviço.')
    if (!data || !slot) return setErro('Escolha o dia e o horário.')
    if (!nome.trim()) return setErro('Informe seu nome.')
    if (!telefone.trim()) return setErro('Informe seu telefone (WhatsApp).')
    if (!nascimento) return setErro('Informe sua data de nascimento.')
    if (!documento.trim()) return setErro('Informe seu CPF / documento.')
    if (!endereco.trim()) return setErro('Informe seu endereço.')
    if (!confirmo) return setErro('Confirme que as informações de saúde estão corretas.')

    const inicio = combinarDataHora(data, slot)
    const fim = new Date(new Date(inicio).getTime() + duracao * 60000).toISOString()

    setEnviando(true)
    try {
      await enviarAgendamento({
        procedimento_id: procId,
        inicio,
        fim,
        paciente: {
          nome: nome.trim(),
          telefone: telefone.trim(),
          nascimento: nascimento || null,
          documento: documento || null,
          endereco: endereco || null,
        },
        anamnese: respostas,
      })
      setSucesso(true)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar.')
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <Casca>
        <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/40 p-6 text-center">
          <h2 className="text-xl font-bold text-green-800">Pedido enviado! 🎉</h2>
          <p className="mt-2 text-slate-700 dark:text-slate-200">
            Recebemos sua solicitação. <strong>{clinica.profissional}</strong> vai confirmar o
            horário e entrar em contato com você pelo WhatsApp.
          </p>
          <a
            href={`https://wa.me/${clinica.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex min-h-[48px] items-center justify-center rounded-lg bg-green-600 px-4 font-bold text-white"
          >
            Falar no WhatsApp
          </a>
        </div>
      </Casca>
    )
  }

  return (
    <Casca>
      <form onSubmit={aoEnviar} className="flex flex-col gap-6">
        {/* 1. Serviço */}
        <Secao numero={1} titulo="Escolha o serviço">
          <select
            value={procId}
            onChange={(e) => setProcId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione…</option>
            {procedimentos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} · {p.duracao_min} min · {formatReal(p.preco)}
              </option>
            ))}
          </select>
          {proc && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-50 dark:bg-brand-900/40 px-4 py-3">
              <span className="text-sm text-slate-600 dark:text-slate-300">{proc.duracao_min} min</span>
              <span className="text-lg font-bold text-brand-800">{formatReal(proc.preco)}</span>
            </div>
          )}
        </Secao>

        {/* 2. Dia e horário */}
        <Secao numero={2} titulo="Escolha o dia e o horário">
          <DateInputBR value={data} onChange={setData} className={inputClass} />
          {procId && data && (
            <div className="mt-3">
              {carregandoSlots ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Buscando horários livres…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhum horário livre neste dia. Tente outra data.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={
                        'min-h-[44px] rounded-lg border font-bold ' +
                        (slot === s
                          ? 'border-brand-600 bg-brand-700 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200')
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Secao>

        {/* 3. Seus dados */}
        <Secao numero={3} titulo="Seus dados">
          <div className="flex flex-col gap-3">
            <Campo rotulo="Nome completo *">
              <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
            </Campo>
            <Campo rotulo="Telefone (WhatsApp) *">
              <TelefoneInput value={telefone} onChange={setTelefone} className={inputClass} />
            </Campo>
            <Campo rotulo="Data de nascimento *">
              <DateInputBR value={nascimento} onChange={setNascimento} className={inputClass} />
            </Campo>
            <Campo rotulo="CPF / documento *">
              <input
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className={inputClass}
              />
            </Campo>
            <Campo rotulo="Endereço *">
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className={inputClass}
              />
            </Campo>
          </div>
        </Secao>

        {/* 4. Ficha de saúde */}
        <Secao numero={4} titulo="Ficha de saúde">
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">Marque o que se aplica a você.</p>
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {ANAMNESE_SIM_NAO.map((q) => (
              <label
                key={q.chave}
                className="flex min-h-[48px] cursor-pointer items-center justify-between px-4"
              >
                <span className="text-slate-700 dark:text-slate-200">{q.rotulo}</span>
                <input
                  type="checkbox"
                  checked={respostas[q.chave] === true}
                  onChange={(e) => setSimNao(q.chave, e.target.checked)}
                  className="h-6 w-6 accent-brand-600"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-3">
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
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmo}
              onChange={(e) => setConfirmo(e.target.checked)}
              className="mt-1 h-5 w-5 accent-brand-600"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Confirmo que as informações de saúde acima estão corretas.
            </span>
          </label>
        </Secao>

        {erro && (
          <p role="alert" className="font-bold text-red-700">
            {erro}
          </p>
        )}

        <BotaoPrimario type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Solicitar agendamento'}
        </BotaoPrimario>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          O horário só é confirmado após {clinica.profissional} aprovar.
        </p>
      </form>
    </Casca>
  )
}

// Moldura da página pública (sem as abas do app).
function Casca({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 dark:bg-slate-800 px-4 pb-10">
      <header className="flex flex-col items-center py-6 text-center">
        <img src={clinica.logoUrl} alt="" className="h-16 w-16 rounded-full object-contain" />
        <h1 className="mt-2 text-xl font-bold text-brand-800">{clinica.nome}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {clinica.profissional} · {clinica.cidadeUf}
        </p>
        <p className="mt-1 font-bold text-slate-700 dark:text-slate-200">Agende sua consulta</p>
      </header>
      {children}
    </div>
  )
}

function Secao({
  numero,
  titulo,
  children,
}: {
  numero: number
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-sm text-white">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}
