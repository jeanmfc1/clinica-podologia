import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePacientes } from '../features/pacientes/api'
import { formatTelefone } from '../lib/format'
import { Aviso, inputClass, PageHeader } from '../components/ui'

export function PacientesPage() {
  const [busca, setBusca] = useState('')
  const { data: pacientes, isLoading, isError } = usePacientes(busca)

  return (
    <section>
      <PageHeader
        titulo="Pacientes"
        acao={
          <Link
            to="/pacientes/novo"
            className="min-h-[44px] rounded-lg bg-brand-700 px-4 py-2 font-bold text-white"
          >
            + Novo
          </Link>
        }
      />

      <input
        type="search"
        placeholder="Buscar por nome…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className={inputClass + ' mb-4'}
      />

      {isLoading && <Aviso>Carregando…</Aviso>}
      {isError && <Aviso>Não foi possível carregar os pacientes.</Aviso>}

      {pacientes && pacientes.length === 0 && (
        <Aviso>
          Nenhum paciente ainda.
          <br />
          Toque em “+ Novo” para cadastrar o primeiro.
        </Aviso>
      )}

      {pacientes && pacientes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pacientes.map((p) => (
            <li key={p.id}>
              <Link
                to={`/pacientes/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800">
                  {p.nome.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900 dark:text-slate-50">{p.nome}</span>
                  <span className="block text-sm text-slate-500 dark:text-slate-400">
                    {formatTelefone(p.telefone) || 'Sem telefone'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
