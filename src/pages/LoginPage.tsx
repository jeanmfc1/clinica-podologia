import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabaseConfigurado } from '../lib/supabase'
import { clinica } from '../config'

export function LoginPage() {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const { erro } = await entrar(email, senha)
    setEnviando(false)
    if (erro) {
      setErro(erro)
      return
    }
    navigate('/agenda', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-brand-800">{clinica.nome}</h1>
      <p className="mt-1 mb-6 text-slate-600">Entre para acessar a clínica.</p>

      {!supabaseConfigurado && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          O login ainda não está conectado. Falta configurar o Supabase (arquivo
          .env). Até lá, esta tela é só demonstração.
        </div>
      )}

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-bold text-slate-700">E-mail</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[48px] rounded-lg border border-slate-300 bg-white px-3 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-bold text-slate-700">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="min-h-[48px] rounded-lg border border-slate-300 bg-white px-3 text-base"
          />
        </label>

        {erro && (
          <p role="alert" className="text-sm font-bold text-red-700">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="min-h-[48px] rounded-lg bg-brand-700 px-4 font-bold text-white disabled:opacity-60"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
