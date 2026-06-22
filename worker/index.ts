// Backend (Cloudflare Worker) do Pés de Anjo.
// Responde as rotas /api/*; qualquer outra coisa é servida como arquivo do app.

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
  // Segredos (definidos via `wrangler secret put` — preenchidos nas próximas etapas):
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      // Teste de saúde do backend.
      if (url.pathname === '/api/ping') {
        return json({ ok: true, servico: 'pes-de-anjo', hora: new Date().toISOString() })
      }
      return json({ erro: 'rota não encontrada' }, 404)
    }

    // Tudo que não é /api/* é o app (arquivos estáticos + fallback SPA).
    return env.ASSETS.fetch(request)
  },
}
