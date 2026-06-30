import { useEffect, useState } from 'react'

export type Tema = 'claro' | 'escuro' | 'auto'
const CHAVE = 'tema'

export function getTema(): Tema {
  return (localStorage.getItem(CHAVE) as Tema) || 'auto'
}

export function aplicarTema(t: Tema) {
  const escuro =
    t === 'escuro' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', escuro)
}

// Hook pro botão de tema na tela "Mais".
export function useTema() {
  const [tema, setTema] = useState<Tema>(getTema())

  function mudar(t: Tema) {
    localStorage.setItem(CHAVE, t)
    aplicarTema(t)
    setTema(t)
  }

  // No modo automático, acompanha a mudança do sistema.
  useEffect(() => {
    if (tema !== 'auto') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const aoMudar = () => aplicarTema('auto')
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [tema])

  return { tema, mudar }
}
