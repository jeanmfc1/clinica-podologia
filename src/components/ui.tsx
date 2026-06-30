import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

// Classe padrão dos campos de formulário (alvo de toque grande, legível).
export const inputClass =
  'min-h-[48px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-base text-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'

// Cabeçalho de página com botão de voltar opcional.
export function PageHeader({
  titulo,
  voltar,
  acao,
}: {
  titulo: string
  voltar?: boolean
  acao?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="mb-4 flex items-center gap-2">
      {voltar && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-xl font-bold text-slate-900 dark:text-slate-50">{titulo}</h1>
      {acao}
    </header>
  )
}

// Campo de formulário com rótulo.
export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-bold text-slate-700 dark:text-slate-200">{rotulo}</span>
      {children}
    </label>
  )
}

export function BotaoPrimario({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        'min-h-[48px] rounded-lg bg-brand-700 px-4 font-bold text-white disabled:opacity-60 ' +
        (props.className ?? '')
      }
    >
      {children}
    </button>
  )
}

// Estado vazio / carregando / erro padronizados.
export function Aviso({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 text-center text-slate-500 dark:text-slate-400">
      {children}
    </div>
  )
}
