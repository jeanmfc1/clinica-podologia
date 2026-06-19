import type { ReactNode } from 'react'

// Página de espaço reservado usada na Fase 0.
// Cada módulo real (Agenda, Pacientes, etc.) substitui isto nas próximas fases.
export function PlaceholderPage({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao: string
  children?: ReactNode
}) {
  return (
    <section>
      <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
      <p className="mt-1 text-slate-600">{descricao}</p>
      <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
        Em construção — chega na próxima fase.
      </div>
      {children}
    </section>
  )
}
