import { createClient } from '@supabase/supabase-js'

// URL e chave PÚBLICA (anon) do Supabase. São públicas por natureza (vão no
// front de qualquer forma); a segurança real vem das políticas RLS no banco.
// Ficam como padrão aqui para o build funcionar em qualquer lugar (inclusive na
// nuvem, sem .env). O .env local, se existir, tem prioridade.
const URL_PADRAO = 'https://byqxokwfzzmrbqsbibeg.supabase.co'
const ANON_PADRAO =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cXhva3dmenptcmJxc2JpYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjM4MTksImV4cCI6MjA5NzQ5OTgxOX0.voeRbGmpnxAzzc-LpekczAEZpkNDGknUU2qFUoy2JR8'

// .trim() remove espaços/quebras de linha que às vezes entram por engano numa
// variável de build (isso quebrava o login com "fetch ... Invalid value").
// Se a variável vier vazia depois de limpar, usa o valor padrão embutido.
const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

const url = envUrl || URL_PADRAO
const anonKey = envKey || ANON_PADRAO

export const supabaseConfigurado = Boolean(url && anonKey)

export const supabase = createClient(url, anonKey)
