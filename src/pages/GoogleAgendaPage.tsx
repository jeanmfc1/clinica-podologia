import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGet, apiPost } from '../lib/apiBackend'
import { Aviso, BotaoPrimario, PageHeader } from '../components/ui'

type Status = { conectado: boolean; email: string | null; ultimo_sync: string | null }

export function GoogleAgendaPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState<Status | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const recemConectado = params.get('google') === 'conectado'

  async function carregarStatus() {
    setCarregando(true)
    setErro(null)
    try {
      setStatus(await apiGet<Status>('/api/google/status'))
    } catch {
      setErro('Não foi possível verificar a conexão.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarStatus()
  }, [])

  async function conectar() {
    setErro(null)
    try {
      const { url } = await apiGet<{ url: string }>('/api/google/oauth/start')
      window.location.href = url // vai para o consentimento do Google
    } catch {
      setErro('Não foi possível iniciar a conexão.')
    }
  }

  async function desconectar() {
    if (!confirm('Desconectar o Google Agenda?')) return
    try {
      await apiPost('/api/google/disconnect')
      await carregarStatus()
    } catch {
      setErro('Não foi possível desconectar.')
    }
  }

  return (
    <section>
      <PageHeader titulo="Google Agenda" voltar />

      <p className="mb-4 text-slate-600 dark:text-slate-300">
        Conecte a agenda do Google para sincronizar as consultas.
      </p>

      {recemConectado && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/40 p-3 font-bold text-green-800">
          Conta conectada com sucesso!
        </div>
      )}

      {carregando && <Aviso>Verificando…</Aviso>}
      {erro && (
        <p role="alert" className="mb-4 font-bold text-red-700">
          {erro}
        </p>
      )}

      {!carregando && status && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          {status.conectado ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">Conectado como</p>
              <p className="mb-4 font-bold text-slate-800 dark:text-slate-100">{status.email ?? 'conta Google'}</p>
              <button
                onClick={desconectar}
                className="min-h-[44px] w-full rounded-lg border border-red-300 px-4 font-bold text-red-700"
              >
                Desconectar
              </button>
            </>
          ) : (
            <>
              <p className="mb-4 text-slate-700 dark:text-slate-200">Nenhuma conta conectada ainda.</p>
              <BotaoPrimario onClick={conectar} className="w-full">
                Conectar Google Agenda
              </BotaoPrimario>
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Ao conectar, pode aparecer um aviso do Google de “app não verificado”. É
        normal para uso próprio — toque em “Avançado” e depois em “Acessar”.
      </p>
    </section>
  )
}
