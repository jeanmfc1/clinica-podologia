// Backend (Cloudflare Worker) do Pés de Anjo.
// Rotas /api/*; o resto é o app (arquivos estáticos).

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  APP_URL: string
}

const SCOPE = 'openid email https://www.googleapis.com/auth/calendar'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

const enc = (s: string) => new TextEncoder().encode(s)
const dec = (b: ArrayBuffer | Uint8Array) =>
  new TextDecoder().decode(b instanceof Uint8Array ? b : new Uint8Array(b))

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function unb64url(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// ---------- Supabase (REST, com service_role) ----------
async function sb(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

// Descobre a clínica do usuário logado a partir do token Supabase no header.
async function clinicaDoUsuario(request: Request, env: Env): Promise<string | null> {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  const u = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!u.ok) return null
  const user = (await u.json()) as { id?: string }
  if (!user.id) return null
  const r = await sb(env, `usuarios?id=eq.${user.id}&select=clinica_id`)
  const rows = (await r.json()) as { clinica_id: string }[]
  return rows[0]?.clinica_id ?? null
}

// ---------- Estado assinado (state do OAuth) ----------
async function hmac(env: Env, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc(env.GOOGLE_CLIENT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc(msg))
  return b64url(new Uint8Array(sig))
}
async function criarState(env: Env, clinicaId: string): Promise<string> {
  return b64url(enc(clinicaId)) + '.' + (await hmac(env, clinicaId))
}
async function lerState(env: Env, state: string): Promise<string | null> {
  const [a, b] = state.split('.')
  if (!a || !b) return null
  const clinicaId = dec(unb64url(a))
  return (await hmac(env, clinicaId)) === b ? clinicaId : null
}

// ---------- Google OAuth ----------
function redirectUri(env: Env): string {
  return `${env.APP_URL}/api/google/oauth/callback`
}
function urlConsentimento(env: Env, state: string): string {
  const p = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(env),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`
}
async function trocarCodigo(env: Env, code: string) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(env),
      grant_type: 'authorization_code',
    }),
  })
  return (await r.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    id_token?: string
    error?: string
  }
}
// Lê o e-mail do id_token (JWT) sem chamada extra.
function emailDoIdToken(idToken?: string): string | null {
  if (!idToken) return null
  try {
    const payload = JSON.parse(dec(unb64url(idToken.split('.')[1])))
    return payload.email ?? null
  } catch {
    return null
  }
}

function paginaSimples(titulo: string, msg: string, app: string): Response {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title></head>
<body style="font-family:system-ui;padding:2rem;text-align:center;color:#0f172a">
<h1 style="color:#0f766e">${titulo}</h1><p>${msg}</p>
<p><a href="${app}" style="color:#0f766e;font-weight:bold">Voltar ao app</a></p>
</body></html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const p = url.pathname

    if (!p.startsWith('/api/')) return env.ASSETS.fetch(request)

    // Saúde do backend.
    if (p === '/api/ping') return json({ ok: true, hora: new Date().toISOString() })

    // Inicia a conexão: devolve a URL de consentimento do Google.
    if (p === '/api/google/oauth/start') {
      const clinicaId = await clinicaDoUsuario(request, env)
      if (!clinicaId) return json({ erro: 'não autenticado' }, 401)
      const state = await criarState(env, clinicaId)
      return json({ url: urlConsentimento(env, state) })
    }

    // Retorno do Google após o usuário autorizar.
    if (p === '/api/google/oauth/callback') {
      const code = url.searchParams.get('code') || ''
      const state = url.searchParams.get('state') || ''
      const erroG = url.searchParams.get('error')
      if (erroG) return paginaSimples('Conexão cancelada', 'Você não autorizou o acesso.', env.APP_URL + '/mais')
      const clinicaId = state ? await lerState(env, state) : null
      if (!code || !clinicaId)
        return paginaSimples('Erro na conexão', 'Link inválido. Tente conectar de novo.', env.APP_URL + '/mais')

      const tk = await trocarCodigo(env, code)
      if (!tk.access_token)
        return paginaSimples('Erro na conexão', 'Não foi possível obter o acesso. Tente de novo.', env.APP_URL + '/mais')

      const exp = new Date(Date.now() + (tk.expires_in ?? 3600) * 1000).toISOString()
      const email = emailDoIdToken(tk.id_token)
      const registro: Record<string, unknown> = {
        clinica_id: clinicaId,
        access_token: tk.access_token,
        access_token_exp: exp,
        email_google: email,
        conectado_em: new Date().toISOString(),
        calendar_id: 'primary',
      }
      // refresh_token só vem na 1ª autorização; se vier, salva.
      if (tk.refresh_token) registro.refresh_token = tk.refresh_token

      await sb(env, 'google_integracao?on_conflict=clinica_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(registro),
      })

      return Response.redirect(`${env.APP_URL}/mais?google=conectado`, 302)
    }

    // Status da conexão (para o app mostrar conectado/desconectado).
    if (p === '/api/google/status') {
      const clinicaId = await clinicaDoUsuario(request, env)
      if (!clinicaId) return json({ erro: 'não autenticado' }, 401)
      const r = await sb(
        env,
        `google_integracao?clinica_id=eq.${clinicaId}&select=email_google,refresh_token,conectado_em,ultimo_sync`,
      )
      const rows = (await r.json()) as {
        email_google: string | null
        refresh_token: string | null
        conectado_em: string | null
        ultimo_sync: string | null
      }[]
      const reg = rows[0]
      return json({
        conectado: !!reg?.refresh_token,
        email: reg?.email_google ?? null,
        ultimo_sync: reg?.ultimo_sync ?? null,
      })
    }

    // Desconectar.
    if (p === '/api/google/disconnect' && request.method === 'POST') {
      const clinicaId = await clinicaDoUsuario(request, env)
      if (!clinicaId) return json({ erro: 'não autenticado' }, 401)
      await sb(env, `google_integracao?clinica_id=eq.${clinicaId}`, { method: 'DELETE' })
      return json({ ok: true })
    }

    return json({ erro: 'rota não encontrada' }, 404)
  },
}
