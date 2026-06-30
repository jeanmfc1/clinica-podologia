import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProcedimentos, useSeedProcedimentos } from '../features/procedimentos/api'
import { LISTA_INICIAL } from '../features/procedimentos/listaInicial'
import { formatReal } from '../lib/format'
import { Aviso, PageHeader } from '../components/ui'

export function ProcedimentosPage() {
  const { data: lista, isLoading, isError } = useProcedimentos()
  const seed = useSeedProcedimentos()
  const [erroSeed, setErroSeed] = useState<string | null>(null)

  async function popular() {
    setErroSeed(null)
    try {
      await seed.mutateAsync(LISTA_INICIAL)
    } catch {
      setErroSeed('Não foi possível adicionar a lista. Tente de novo.')
    }
  }

  return (
    <section>
      <PageHeader
        titulo="Procedimentos"
        voltar
        acao={
          <Link
            to="/procedimentos/novo"
            className="min-h-[44px] rounded-lg bg-brand-700 px-4 py-2 font-bold text-white"
          >
            + Novo
          </Link>
        }
      />

      {isLoading && <Aviso>Carregando…</Aviso>}
      {isError && <Aviso>Não foi possível carregar os procedimentos.</Aviso>}

      {lista && lista.length === 0 && (
        <div className="flex flex-col gap-4">
          <Aviso>Nenhum procedimento cadastrado ainda.</Aviso>
          <button
            onClick={popular}
            disabled={seed.isPending}
            className="min-h-[48px] rounded-lg bg-brand-700 px-4 font-bold text-white disabled:opacity-60"
          >
            {seed.isPending
              ? 'Adicionando…'
              : 'Adicionar lista de preços da Pés de Anjo'}
          </button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Cadastra os {LISTA_INICIAL.length} serviços com os preços. Você pode
            editar tudo depois.
          </p>
          {erroSeed && (
            <p role="alert" className="text-center font-bold text-red-700">
              {erroSeed}
            </p>
          )}
        </div>
      )}

      {lista && lista.length > 0 && (
        <ul className="flex flex-col gap-2">
          {lista.map((p) => (
            <li key={p.id}>
              <Link
                to={`/procedimentos/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
              >
                <span className="min-w-0">
                  <span
                    className={
                      'block font-bold ' +
                      (p.ativo ? 'text-slate-900 dark:text-slate-50' : 'text-slate-400 dark:text-slate-500 line-through')
                    }
                  >
                    {p.nome}
                  </span>
                  <span className="block text-sm text-slate-500 dark:text-slate-400">
                    {p.duracao_min} min
                  </span>
                </span>
                <span className="shrink-0 font-bold text-brand-700">
                  {formatReal(p.preco)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
