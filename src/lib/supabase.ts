import { createClient } from '@supabase/supabase-js'

// As credenciais ficam em variáveis de ambiente (arquivo .env, nunca versionado).
// VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são públicas por natureza no front;
// a segurança real vem das políticas RLS no banco.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Sinaliza para a UI se ainda falta configurar o Supabase.
export const supabaseConfigurado = Boolean(url && anonKey)

// Cria o cliente mesmo sem env (com placeholders) para o app rodar localmente
// e mostrar uma mensagem amigável até as credenciais existirem.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
)
