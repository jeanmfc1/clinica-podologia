import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { clinica } from '../config'
import { useTema, type Tema } from '../lib/tema'

export function MaisPage() {
  const { user, sair } = useAuth()
  const { tema, mudar } = useTema()
  const opcoesTema: { valor: Tema; rotulo: string }[] = [
    { valor: 'claro', rotulo: 'Claro' },
    { valor: 'escuro', rotulo: 'Escuro' },
    { valor: 'auto', rotulo: 'Automático' },
  ]

  // Itens já prontos têm rota; os demais aparecem como "em breve".
  const itens: { rotulo: string; para?: string }[] = [
    { rotulo: 'Procedimentos', para: '/procedimentos' },
    { rotulo: 'Google Agenda', para: '/google' },
    { rotulo: 'Estoque', para: '/estoque' },
    { rotulo: 'Termos e consentimento' },
    { rotulo: 'Relatórios', para: '/relatorios' },
    { rotulo: 'Configurações da clínica' },
  ]

  return (
    <section>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Mais</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">{clinica.nome}</p>

      <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {itens.map((item) =>
          item.para ? (
            <li key={item.rotulo}>
              <Link
                to={item.para}
                className="flex min-h-[52px] items-center justify-between px-4 font-bold text-slate-800 dark:text-slate-100"
              >
                {item.rotulo}
                <span className="text-slate-400 dark:text-slate-500">›</span>
              </Link>
            </li>
          ) : (
            <li
              key={item.rotulo}
              className="flex min-h-[52px] items-center justify-between px-4 text-slate-700 dark:text-slate-200"
            >
              {item.rotulo}
              <span className="text-slate-400 dark:text-slate-500">em breve</span>
            </li>
          ),
        )}
      </ul>

      {/* Aparência (tema claro/escuro) */}
      <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-2 font-bold text-slate-800 dark:text-slate-100">Aparência</p>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
          {opcoesTema.map((o) => (
            <button
              key={o.valor}
              onClick={() => mudar(o.valor)}
              className={
                'min-h-[40px] rounded-md font-bold ' +
                (tema === o.valor ? 'bg-white dark:bg-slate-800 text-brand-700 shadow-sm' : 'text-slate-500 dark:text-slate-400')
              }
            >
              {o.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Conectado como</p>
        <p className="font-bold text-slate-800 dark:text-slate-100">{user?.email ?? '—'}</p>
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
