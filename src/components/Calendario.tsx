import { useMemo, useState } from 'react'
import { horarioTrabalho } from '../config'

const LAB = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function ymd(d: Date): string {
  const a = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${a}-${m}-${dd}`
}

// Calendário visual pra escolher o dia. Desativa dias passados e dias em que a
// clínica não atende (segundo horarioTrabalho). Devolve a data em ISO.
export function Calendario({
  value,
  onChange,
}: {
  value: string // ISO ou ''
  onChange: (iso: string) => void
}) {
  const hoje = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [ref, setRef] = useState(() =>
    value ? new Date(`${value}T00:00:00`) : new Date(),
  )
  const ano = ref.getFullYear()
  const mes = ref.getMonth()

  const dias = useMemo(() => {
    const primeiro = new Date(ano, mes, 1)
    const inicio = new Date(ano, mes, 1 - primeiro.getDay()) // volta até domingo
    return Array.from(
      { length: 42 },
      (_, i) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i),
    )
  }, [ano, mes])

  const titulo = ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const fechado = (d: Date) => !horarioTrabalho[d.getDay()]
  const passado = (d: Date) => d < hoje

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setRef(new Date(ano, mes - 1, 1))}
          aria-label="Mês anterior"
          className="h-9 w-9 rounded-lg text-xl text-slate-600 dark:text-slate-300"
        >
          ‹
        </button>
        <span className="font-bold capitalize text-slate-800 dark:text-slate-100">{titulo}</span>
        <button
          type="button"
          onClick={() => setRef(new Date(ano, mes + 1, 1))}
          aria-label="Próximo mês"
          className="h-9 w-9 rounded-lg text-xl text-slate-600 dark:text-slate-300"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
        {LAB.map((l, i) => (
          <div key={i} className="py-1">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dias.map((d, i) => {
          const iso = ymd(d)
          const outroMes = d.getMonth() !== mes
          const desativado = passado(d) || fechado(d)
          const sel = value === iso
          return (
            <button
              key={i}
              type="button"
              disabled={desativado}
              onClick={() => onChange(iso)}
              className={
                'aspect-square rounded-lg text-sm font-bold ' +
                (sel
                  ? 'bg-brand-700 text-white '
                  : desativado
                    ? 'text-slate-300 dark:text-slate-600 '
                    : 'text-slate-700 dark:text-slate-200 ') +
                (outroMes && !sel ? 'opacity-40 ' : '')
              }
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
