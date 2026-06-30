import { Outlet } from 'react-router-dom'
import { BottomTabs } from './BottomTabs'

// Estrutura mobile: conteúdo rolável no topo, abas fixas embaixo.
export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 dark:bg-slate-900 dark:text-slate-100">
      <main className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  )
}
