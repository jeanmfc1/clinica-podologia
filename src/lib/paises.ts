// Lista de países para o seletor de telefone (código DDI).
// Brasil em primeiro por ser o padrão.
export type Pais = { iso: string; dial: string; nome: string; flag: string }

export const PAISES: Pais[] = [
  { iso: 'BR', dial: '55', nome: 'Brasil', flag: '🇧🇷' },
  { iso: 'PT', dial: '351', nome: 'Portugal', flag: '🇵🇹' },
  { iso: 'US', dial: '1', nome: 'EUA / Canadá', flag: '🇺🇸' },
  { iso: 'AR', dial: '54', nome: 'Argentina', flag: '🇦🇷' },
  { iso: 'PY', dial: '595', nome: 'Paraguai', flag: '🇵🇾' },
  { iso: 'UY', dial: '598', nome: 'Uruguai', flag: '🇺🇾' },
  { iso: 'BO', dial: '591', nome: 'Bolívia', flag: '🇧🇴' },
  { iso: 'CL', dial: '56', nome: 'Chile', flag: '🇨🇱' },
  { iso: 'CO', dial: '57', nome: 'Colômbia', flag: '🇨🇴' },
  { iso: 'MX', dial: '52', nome: 'México', flag: '🇲🇽' },
  { iso: 'ES', dial: '34', nome: 'Espanha', flag: '🇪🇸' },
  { iso: 'IT', dial: '39', nome: 'Itália', flag: '🇮🇹' },
  { iso: 'FR', dial: '33', nome: 'França', flag: '🇫🇷' },
  { iso: 'DE', dial: '49', nome: 'Alemanha', flag: '🇩🇪' },
  { iso: 'GB', dial: '44', nome: 'Reino Unido', flag: '🇬🇧' },
  { iso: 'JP', dial: '81', nome: 'Japão', flag: '🇯🇵' },
]

export const PAIS_PADRAO = PAISES[0] // Brasil

// Descobre o país pelo prefixo do número (código mais longo primeiro).
export function acharPaisPorDial(digitos: string): Pais | null {
  const ordenado = [...PAISES].sort((a, b) => b.dial.length - a.dial.length)
  for (const p of ordenado) {
    if (digitos.startsWith(p.dial)) return p
  }
  return null
}
