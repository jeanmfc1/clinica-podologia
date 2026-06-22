import { supabase } from './supabase'

// Chama as rotas /api/* do backend, enviando o token de login.
async function comToken(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(path, { headers: await comToken() })
  if (!r.ok) throw new Error(`Erro ${r.status}`)
  return r.json() as Promise<T>
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(await comToken()) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) throw new Error(`Erro ${r.status}`)
  return r.json() as Promise<T>
}
