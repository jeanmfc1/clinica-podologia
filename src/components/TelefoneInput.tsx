import { useEffect, useState } from 'react'
import { acharPaisPorDial, PAIS_PADRAO, PAISES } from '../lib/paises'

// Máscara brasileira para o número local: (62) 99999-9999
function mascaraBR(digitos: string): string {
  const d = digitos.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Separa um valor salvo (dígitos com DDI) em país + número local.
function separar(valor: string): { dial: string; local: string } {
  const d = (valor || '').replace(/\D/g, '')
  if (!d) return { dial: PAIS_PADRAO.dial, local: '' }
  const pais = acharPaisPorDial(d)
  if (pais && d.length > pais.dial.length) {
    return { dial: pais.dial, local: d.slice(pais.dial.length) }
  }
  // Sem código reconhecido: trata como número local do Brasil.
  return { dial: PAIS_PADRAO.dial, local: d }
}

// Campo de telefone com seletor de país (DDI) + número local.
// Guarda o valor como dígitos com o código do país, ex.: 5562999999999.
export function TelefoneInput({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (digitos: string) => void
  className?: string
}) {
  const inicial = separar(value)
  const [dial, setDial] = useState(inicial.dial)
  const [local, setLocal] = useState(inicial.local)

  // Sincroniza quando o valor vem de fora (edição), sem atrapalhar a digitação.
  useEffect(() => {
    const combinadoAtual = local ? dial + local : ''
    if (value !== combinadoAtual) {
      const p = separar(value)
      setDial(p.dial)
      setLocal(p.local)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function emitir(novoDial: string, novoLocal: string) {
    const digitos = novoLocal ? novoDial + novoLocal : ''
    onChange(digitos)
  }

  function aoTrocarPais(e: React.ChangeEvent<HTMLSelectElement>) {
    setDial(e.target.value)
    emitir(e.target.value, local)
  }

  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, '').slice(0, 15)
    setLocal(digitos)
    emitir(dial, digitos)
  }

  const ehBrasil = dial === PAIS_PADRAO.dial
  const exibicao = ehBrasil ? mascaraBR(local) : local

  return (
    <div className="flex gap-2">
      <select
        value={dial}
        onChange={aoTrocarPais}
        aria-label="País"
        className="min-h-[48px] rounded-lg border border-slate-300 bg-white px-2 text-base"
      >
        {PAISES.map((p) => (
          <option key={p.iso} value={p.dial}>
            {p.flag} +{p.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        placeholder={ehBrasil ? '(62) 99999-9999' : 'número'}
        value={exibicao}
        onChange={aoDigitar}
        className={className}
      />
    </div>
  )
}
