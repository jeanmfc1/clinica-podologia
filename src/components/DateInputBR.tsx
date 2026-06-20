import { useEffect, useState } from 'react'

// Converte ISO 'AAAA-MM-DD' -> 'DD/MM/AAAA' (para exibir).
function isoParaBr(iso: string): string {
  if (!iso) return ''
  const [a, m, d] = iso.slice(0, 10).split('-')
  if (!a || !m || !d) return ''
  return `${d}/${m}/${a}`
}

// Recebe só dígitos e devolve mascarado 'DD/MM/AAAA'.
function mascarar(digitos: string): string {
  const d = digitos.slice(0, 8)
  let out = d.slice(0, 2)
  if (d.length >= 3) out += '/' + d.slice(2, 4)
  if (d.length >= 5) out += '/' + d.slice(4, 8)
  return out
}

// Campo de data no formato brasileiro (DD/MM/AAAA), independente do navegador.
// Recebe e devolve o valor em ISO ('AAAA-MM-DD'), que é o que o banco usa.
export function DateInputBR({
  value,
  onChange,
  className,
  id,
}: {
  value: string // ISO ou ''
  onChange: (iso: string) => void
  className?: string
  id?: string
}) {
  const [texto, setTexto] = useState(() => isoParaBr(value))

  // Sincroniza quando o valor vem de fora (ex.: edição de paciente),
  // sem atrapalhar a digitação.
  useEffect(() => {
    const digitosAtuais = texto.replace(/\D/g, '')
    const isoAtual =
      digitosAtuais.length === 8
        ? `${digitosAtuais.slice(4, 8)}-${digitosAtuais.slice(2, 4)}-${digitosAtuais.slice(0, 2)}`
        : ''
    if (value !== isoAtual) {
      setTexto(isoParaBr(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, '').slice(0, 8)
    setTexto(mascarar(digitos))
    if (digitos.length === 8) {
      const dia = digitos.slice(0, 2)
      const mes = digitos.slice(2, 4)
      const ano = digitos.slice(4, 8)
      onChange(`${ano}-${mes}-${dia}`)
    } else {
      onChange('') // incompleto = sem data
    }
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="dd/mm/aaaa"
      maxLength={10}
      value={texto}
      onChange={aoDigitar}
      className={className}
    />
  )
}
