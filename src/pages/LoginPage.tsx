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
  const [mostrarSenha, setMostrarSenha] = useState(false)
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
      <img
        src={clinica.logoUrl}
        alt={`Logo ${clinica.nome}`}
        className="mx-auto mb-4 h-28 w-auto"
      />
      <h1 className="text-center text-2xl font-bold text-brand-800">{clinica.nome}</h1>
      <p className="mb-6 mt-1 text-center text-slate-600 dark:text-slate-300">
        {clinica.profissional} · Podóloga
      </p>

      {!supabaseConfigurado && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-900"
        >
          O login ainda não está conectado. Falta configurar o Supabase (arquivo
          .env). Até lá, esta tela é só demonstração.
        </div>
      )}

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-bold text-slate-700 dark:text-slate-200">E-mail</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[48px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-bold text-slate-700 dark:text-slate-200">Senha</span>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-3 pr-20 text-base"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-pressed={mostrarSenha}
              className="absolute right-1 top-1 bottom-1 rounded-md px-3 text-sm font-bold text-brand-700"
            >
              {mostrarSenha ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
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
