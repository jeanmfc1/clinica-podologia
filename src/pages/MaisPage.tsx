import { useAuth } from '../auth/AuthContext'
import { clinica } from '../config'

export function MaisPage() {
  const { user, sair } = useAuth()

  const itens = [
    'Procedimentos',
    'Estoque',
    'Termos e consentimento',
    'Relatórios',
    'Configurações da clínica',
  ]

  return (
    <section>
      <h1 className="text-xl font-bold text-slate-900">Mais</h1>
      <p className="mt-1 text-slate-600">{clinica.nome}</p>

      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {itens.map((item) => (
          <li
            key={item}
            className="flex min-h-[52px] items-center justify-between px-4 text-slate-700"
          >
            {item}
            <span className="text-slate-400">em breve</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Conectado como</p>
        <p className="font-bold text-slate-800">{user?.email ?? '—'}</p>
        <button
          onClick={() => sair()}
          className="mt-3 min-h-[44px] w-full rounded-lg border border-red-300 px-4 font-bold text-red-700"
        >
          Sair
        </button>
      </div>
    </section>
  )
}
