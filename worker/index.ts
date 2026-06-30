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

// A clínica (sistema de uma clínica só) — usada nas rotas públicas.
async function clinicaUnica(env: Env): Promise<string | null> {
  const r = await sb(env, 'clinicas?select=id&order=created_at&limit=1')
  const rows = (await r.json()) as { id: string }[]
  return rows[0]?.id ?? null
}

// Um profissional da clínica (pra preencher o dono da consulta no agendamento online).
async function profissionalDaClinica(env: Env, clinicaId: string): Promise<string | null> {
  const r = await sb(env, `usuarios?clinica_id=eq.${clinicaId}&select=id&limit=1`)
  const rows = (await r.json()) as { id: string }[]
  return rows[0]?.id ?? null
}

const soDigitos = (s: string) => (s || '').replace(/\D/g, '')

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

// ---------- Google Calendar (sincronização) ----------
type Integracao = {
  clinica_id: string
  refresh_token: string | null
  access_token: string | null
  access_token_exp: string | null
  calendar_id: string
}

async function lerIntegracao(env: Env, clinicaId: string): Promise<Integracao | null> {
  const r = await sb(
    env,
    `google_integracao?clinica_id=eq.${clinicaId}&select=clinica_id,refresh_token,access_token,access_token_exp,calendar_id`,
  )
  const rows = (await r.json()) as Integracao[]
  return rows[0] ?? null
}

// Devolve um access_token válido; renova pelo refresh_token se estiver vencido.
async function tokenValido(env: Env, reg: Integracao): Promise<string | null> {
  if (!reg.refresh_token) return null
  const margem = 60_000 // renova 1 min antes de vencer
  if (
    reg.access_token &&
    reg.access_token_exp &&
    new Date(reg.access_token_exp).getTime() - Date.now() > margem
  ) {
    return reg.access_token
  }
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: reg.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const tk = (await r.json()) as { access_token?: string; expires_in?: number }
  if (!tk.access_token) return null
  const exp = new Date(Date.now() + (tk.expires_in ?? 3600) * 1000).toISOString()
  await sb(env, `google_integracao?clinica_id=eq.${reg.clinica_id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ access_token: tk.access_token, access_token_exp: exp }),
  })
  return tk.access_token
}

type AgendaRow = {
  id: string
  inicio: string
  fim: string
  status: string
  observacao: string | null
  google_event_id: string | null
  paciente: { nome: string } | null
  procedimento: { nome: string } | null
}

type GEvent = {
  id?: string
  summary?: string
  status?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  extendedProperties?: { private?: { origem?: string } }
}

function corpoEvento(a: AgendaRow) {
  const titulo =
    (a.paciente?.nome ?? 'Consulta') + (a.procedimento ? ' — ' + a.procedimento.nome : '')
  const linhas = ['Pés de Anjo · Podologia']
  if (a.observacao) linhas.push('', a.observacao)
  return {
    summary: titulo,
    description: linhas.join('\n'),
    start: { dateTime: a.inicio, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: a.fim, timeZone: 'America/Sao_Paulo' },
    // Marca o evento como criado pelo app (pra não duplicar na leitura).
    extendedProperties: { private: { origem: 'pesdeanjo', agendamento_id: a.id } },
  }
}

function calFetch(token: string, calId: string, path: string, init: RequestInit = {}) {
  return fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        ...(init.headers || {}),
      },
    },
  )
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

    // =================================================================
    // AGENDAMENTO ONLINE (rotas PÚBLICAS — sem login).
    // =================================================================

    // Procedimentos ativos (o paciente escolhe o serviço).
    if (p === '/api/agendar/procedimentos') {
      const clinicaId = await clinicaUnica(env)
      if (!clinicaId) return json({ procedimentos: [] })
      const r = await sb(
        env,
        `procedimentos?clinica_id=eq.${clinicaId}&ativo=eq.true&select=id,nome,duracao_min,preco&order=nome`,
      )
      return json({ procedimentos: await r.json() })
    }

    // Horários ocupados num intervalo (consultas + bloqueios), pra esconder slots cheios.
    if (p === '/api/agendar/ocupados') {
      const clinicaId = await clinicaUnica(env)
      const ini = url.searchParams.get('ini')
      const fim = url.searchParams.get('fim')
      if (!clinicaId || !ini || !fim) return json({ ocupados: [] })
      const ag = await sb(
        env,
        `agendamentos?clinica_id=eq.${clinicaId}&inicio=gte.${ini}&inicio=lt.${fim}&status=neq.cancelado&select=inicio,fim`,
      )
      const bl = await sb(
        env,
        `bloqueios_agenda?clinica_id=eq.${clinicaId}&inicio=lt.${fim}&fim=gt.${ini}&select=inicio,fim`,
      )
      const ocupados = [
        ...((await ag.json()) as unknown[]),
        ...((await bl.json()) as unknown[]),
      ]
      return json({ ocupados })
    }

    // Cria o pedido de agendamento: paciente + consulta (a confirmar) + anamnese.
    if (p === '/api/agendar' && request.method === 'POST') {
      const clinicaId = await clinicaUnica(env)
      if (!clinicaId) return json({ erro: 'clínica não encontrada' }, 500)
      const profId = await profissionalDaClinica(env, clinicaId)

      const body = (await request.json().catch(() => ({}))) as {
        procedimento_id?: string
        inicio?: string
        fim?: string
        paciente?: {
          nome?: string
          telefone?: string
          nascimento?: string | null
          documento?: string | null
          endereco?: string | null
        }
        anamnese?: Record<string, unknown>
      }

      const nome = (body.paciente?.nome || '').trim()
      const telefone = soDigitos(body.paciente?.telefone || '')
      if (!nome || !telefone) return json({ erro: 'Informe nome e telefone.' }, 400)
      if (!body.inicio || !body.fim) return json({ erro: 'Escolha um horário.' }, 400)

      // Acha o paciente pelo telefone; se não existir, cria.
      const busca = await sb(
        env,
        `pacientes?clinica_id=eq.${clinicaId}&telefone=eq.${telefone}&select=id&limit=1`,
      )
      let pacienteId = ((await busca.json()) as { id: string }[])[0]?.id ?? null

      if (!pacienteId) {
        const ins = await sb(env, 'pacientes?select=id', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            clinica_id: clinicaId,
            nome,
            telefone,
            nascimento: body.paciente?.nascimento || null,
            documento: body.paciente?.documento || null,
            endereco: body.paciente?.endereco || null,
          }),
        })
        if (!ins.ok) {
          console.log('agendar: erro criar paciente', ins.status, await ins.text())
          return json({ erro: 'Não foi possível salvar o cadastro.' }, 500)
        }
        pacienteId = ((await ins.json()) as { id: string }[])[0]?.id ?? null
      }
      if (!pacienteId) return json({ erro: 'Falha ao identificar o paciente.' }, 500)

      // Cria a consulta como "a confirmar" (status agendado), marcada como online.
      const ag = await sb(env, 'agendamentos', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          clinica_id: clinicaId,
          paciente_id: pacienteId,
          procedimento_id: body.procedimento_id || null,
          profissional_id: profId,
          inicio: body.inicio,
          fim: body.fim,
          status: 'agendado',
          origem: 'online',
          observacao: 'Agendamento feito pelo paciente (online).',
        }),
      })
      if (!ag.ok) {
        console.log('agendar: erro criar consulta', ag.status, await ag.text())
        return json({ erro: 'Não foi possível registrar o pedido.' }, 500)
      }

      // Salva a anamnese (uma por paciente).
      if (body.anamnese) {
        await sb(env, 'anamneses?on_conflict=paciente_id', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({
            clinica_id: clinicaId,
            paciente_id: pacienteId,
            respostas_json: body.anamnese,
            atualizado_em: new Date().toISOString(),
          }),
        })
      }

      return json({ ok: true })
    }

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
      if (!tk.access_token) {
        console.log('google token error:', JSON.stringify(tk))
        return paginaSimples(
          'Erro na conexão',
          'O Google recusou a troca do código. Detalhe: ' + (tk.error || 'desconhecido'),
          env.APP_URL + '/google',
        )
      }

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

      const up = await sb(env, 'google_integracao?on_conflict=clinica_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(registro),
      })
      if (!up.ok) {
        const corpo = await up.text()
        console.log('upsert error:', up.status, corpo)
        return paginaSimples(
          'Erro ao salvar',
          `Não foi possível salvar a conexão (${up.status}). ${corpo}`,
          env.APP_URL + '/google',
        )
      }

      return Response.redirect(`${env.APP_URL}/google?google=conectado`, 302)
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

    // Sincroniza um agendamento com o Google (criar/atualizar/excluir o evento).
    // Best-effort: o app chama, mas nunca depende disso pra salvar a consulta.
    if (p === '/api/google/sync' && request.method === 'POST') {
      const clinicaId = await clinicaDoUsuario(request, env)
      if (!clinicaId) return json({ erro: 'não autenticado' }, 401)
      const body = (await request.json().catch(() => ({}))) as { id?: string; deletar?: boolean }
      if (!body.id) return json({ erro: 'id ausente' }, 400)

      const reg = await lerIntegracao(env, clinicaId)
      if (!reg?.refresh_token) return json({ synced: false, motivo: 'desconectado' })
      const token = await tokenValido(env, reg)
      if (!token) return json({ synced: false, motivo: 'sem token' })

      const ar = await sb(
        env,
        `agendamentos?id=eq.${body.id}&clinica_id=eq.${clinicaId}&select=id,inicio,fim,status,observacao,google_event_id,paciente:pacientes(nome),procedimento:procedimentos(nome)`,
      )
      const a = ((await ar.json()) as AgendaRow[])[0]
      if (!a) return json({ synced: false, motivo: 'não encontrado' })

      const calId = reg.calendar_id || 'primary'

      // Excluído ou cancelado → apaga o evento, se existir.
      if (body.deletar || a.status === 'cancelado') {
        if (a.google_event_id) {
          await calFetch(token, calId, `/events/${a.google_event_id}`, { method: 'DELETE' })
        }
        // Se foi só cancelamento (linha continua), zera a referência.
        if (!body.deletar && a.google_event_id) {
          await sb(env, `agendamentos?id=eq.${a.id}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
              google_event_id: null,
              google_sync_em: new Date().toISOString(),
            }),
          })
        }
        return json({ synced: true, google_event_id: null })
      }

      // Criar ou atualizar o evento.
      const corpo = corpoEvento(a)
      let resp: Response
      if (a.google_event_id) {
        resp = await calFetch(token, calId, `/events/${a.google_event_id}`, {
          method: 'PATCH',
          body: JSON.stringify(corpo),
        })
        if (resp.status === 404) {
          // Evento sumiu no Google → recria.
          resp = await calFetch(token, calId, `/events`, {
            method: 'POST',
            body: JSON.stringify(corpo),
          })
        }
      } else {
        resp = await calFetch(token, calId, `/events`, {
          method: 'POST',
          body: JSON.stringify(corpo),
        })
      }
      if (!resp.ok) {
        console.log('calendar sync error', resp.status, await resp.text())
        return json({ synced: false, motivo: 'erro Google', status: resp.status })
      }
      const eventId = ((await resp.json()) as GEvent).id ?? a.google_event_id
      await sb(env, `agendamentos?id=eq.${a.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          google_event_id: eventId,
          google_sync_em: new Date().toISOString(),
        }),
      })
      return json({ synced: true, google_event_id: eventId })
    }

    // Lista eventos do Google num intervalo (pra mostrar dentro do app).
    if (p === '/api/google/events') {
      const clinicaId = await clinicaDoUsuario(request, env)
      if (!clinicaId) return json({ erro: 'não autenticado' }, 401)
      const ini = url.searchParams.get('ini')
      const fim = url.searchParams.get('fim')
      if (!ini || !fim) return json({ erro: 'intervalo ausente' }, 400)

      const reg = await lerIntegracao(env, clinicaId)
      if (!reg?.refresh_token) return json({ conectado: false, eventos: [] })
      const token = await tokenValido(env, reg)
      if (!token) return json({ conectado: false, eventos: [] })

      const calId = reg.calendar_id || 'primary'
      const q = new URLSearchParams({
        timeMin: ini,
        timeMax: fim,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
      })
      const resp = await calFetch(token, calId, `/events?${q}`)
      if (!resp.ok) return json({ conectado: true, eventos: [] })
      const items = ((await resp.json()) as { items?: GEvent[] }).items ?? []
      const eventos = items
        .filter((e) => e.status !== 'cancelled')
        // Esconde o que o próprio app criou (já aparece como consulta).
        .filter((e) => e.extendedProperties?.private?.origem !== 'pesdeanjo')
        .map((e) => ({
          id: e.id,
          titulo: e.summary ?? '(sem título)',
          inicio: e.start?.dateTime ?? e.start?.date ?? null,
          fim: e.end?.dateTime ?? e.end?.date ?? null,
          diaInteiro: !!e.start?.date,
        }))
      return json({ conectado: true, eventos })
    }

    return json({ erro: 'rota não encontrada' }, 404)
  },
}
