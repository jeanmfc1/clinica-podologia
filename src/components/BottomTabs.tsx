import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

type Tab = {
  para: string
  rotulo: string
  icone: ReactNode
}

// Ícones simples em SVG (sem dependência externa). currentColor herda a cor do link.
const tabs: Tab[] = [
  {
    para: '/inicio',
    rotulo: 'Início',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 11l9-8 9 8M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    para: '/agenda',
    rotulo: 'Agenda',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    para: '/pacientes',
    rotulo: 'Pacientes',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
  {
    para: '/atender',
    rotulo: 'Atender',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-2 5 5 0 0 1 9 2c-2 4.5-9 9-9 9z" />
      </svg>
    ),
  },
  {
    para: '/financeiro',
    rotulo: 'Financeiro',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    para: '/mais',
    rotulo: 'Mais',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </svg>
    ),
  },
]

export function BottomTabs() {
  return (
    <nav
      aria-label="Navegação principal"
      className="sticky bottom-0 z-10 grid grid-cols-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.para}
          to={tab.para}
          className={({ isActive }) =>
            [
              // Alvo de toque alto (>= 44px) e legível.
              'flex min-h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-bold',
              isActive ? 'text-brand-700' : 'text-slate-500 dark:text-slate-400',
            ].join(' ')
          }
        >
          <span className="h-6 w-6">{tab.icone}</span>
          {tab.rotulo}
        </NavLink>
      ))}
    </nav>
  )
}
