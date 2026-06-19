import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextValue = {
  session: Session | null
  user: User | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<{ erro: string | null }>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Recupera a sessão salva ao abrir o app.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })

    // Mantém a sessão sincronizada (login, logout, refresh de token).
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const valor = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      carregando,
      async entrar(email, senha) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        })
        return { erro: error ? traduzErro(error.message) : null }
      },
      async sair() {
        await supabase.auth.signOut()
      },
    }),
    [session, carregando],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// Mensagens de erro mais amigáveis em português.
function traduzErro(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (mensagem.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.'
  }
  return 'Não foi possível entrar. Tente novamente.'
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
