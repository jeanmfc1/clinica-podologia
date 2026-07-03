import { createClient } from '@supabase/supabase-js'

// URL e chave PÚBLICA (anon) do Supabase. São públicas por natureza (vão no
// front de qualquer forma); a segurança real vem das políticas RLS no banco.
// Ficam como padrão aqui para o build funcionar em qualquer lugar (inclusive na
// nuvem, sem .env). O .env local, se existir, tem prioridade.
const URL_PADRAO = 'https://byqxokwfzzmrbqsbibeg.supabase.co'
const ANON_PADRAO =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cXhva3dmenptcmJxc2JpYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjM4MTksImV4cCI6MjA5NzQ5OTgxOX0.voeRbGmpnxAzzc-LpekczAEZpkNDGknUU2qFUoy2JR8'

// Remove QUALQUER espaço/quebra de linha (inclusive no meio) que às vezes entra
// por engano numa variável de build. Uma quebra de linha na chave quebrava o
// login com "fetch ... Invalid value" — e o .trim() só limpava as pontas.
function limpar(v: string | undefined | null): string {
  return (v ?? '').replace(/\s+/g, '')
}

// Usa a variável do build só se estiver bem formada; senão, cai no valor
// embutido (que é o correto). Assim, valor "sujo" nunca chega no cliente.
const envUrl = limpar(import.meta.env.VITE_SUPABASE_URL as string | undefined)
const envKey = limpar(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)

const url = /^https:\/\/.+\.supabase\.co$/.test(envUrl) ? envUrl : URL_PADRAO
// JWT = três partes base64url separadas por ponto.
const anonKey = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(envKey)
  ? envKey
  : ANON_PADRAO

export const supabaseConfigurado = Boolean(url && anonKey)

export const supabase = createClient(url, anonKey)
