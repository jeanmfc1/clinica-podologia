// Funções de formatação no padrão brasileiro.
import { acharPaisPorDial, PAIS_PADRAO } from './paises'

// Formata o trecho local de um número brasileiro.
function formatLocalBR(d: string): string {
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}

// Telefone (dígitos com DDI) -> exibição amigável.
// Ex.: 5562999999999 -> +55 (62) 99999-9999
export function formatTelefone(valor: string | null | undefined): string {
  if (!valor) return ''
  const d = valor.replace(/\D/g, '')
  const pais = acharPaisPorDial(d)
  if (pais && d.length > pais.dial.length) {
    const resto = d.slice(pais.dial.length)
    const local = pais.dial === PAIS_PADRAO.dial ? formatLocalBR(resto) : resto
    return `+${pais.dial} ${local}`
  }
  // Sem código reconhecido: assume número local brasileiro.
  return formatLocalBR(d)
}

// Só os dígitos com DDI, para usar em links wa.me.
export function telefoneParaWhatsapp(valor: string | null | undefined): string | null {
  if (!valor) return null
  const d = valor.replace(/\D/g, '')
  if (!d) return null
  // Já tem código de país reconhecido? Usa como está.
  if (acharPaisPorDial(d) && d.length > 7) return d
  // Caso contrário, assume Brasil (compatível com cadastros antigos).
  return PAIS_PADRAO.dial + d
}

export function linkWhatsapp(
  valor: string | null | undefined,
  mensagem?: string,
): string | null {
  const num = telefoneParaWhatsapp(valor)
  if (!num) return null
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return `https://wa.me/${num}${texto}`
}

// Data 'YYYY-MM-DD' -> 'DD/MM/AAAA'
export function formatData(iso: string | null | undefined): string {
  if (!iso) return ''
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  if (!ano || !mes || !dia) return ''
  return `${dia}/${mes}/${ano}`
}

// Idade a partir da data de nascimento 'YYYY-MM-DD'.
export function calcularIdade(nascimento: string | null | undefined): number | null {
  if (!nascimento) return null
  const [a, m, d] = nascimento.slice(0, 10).split('-').map(Number)
  if (!a || !m || !d) return null
  const hoje = new Date()
  let idade = hoje.getFullYear() - a
  const passouAniversario =
    hoje.getMonth() + 1 > m || (hoje.getMonth() + 1 === m && hoje.getDate() >= d)
  if (!passouAniversario) idade--
  return idade
}

export function formatReal(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ---------- Data e hora (a Agenda guarda em timestamptz/UTC) ----------

// data 'AAAA-MM-DD' + hora 'HH:MM' (horário local) -> ISO (UTC) para o banco.
export function combinarDataHora(dataISO: string, hora: string): string {
  const [a, m, d] = dataISO.split('-').map(Number)
  const [hh, mm] = hora.split(':').map(Number)
  return new Date(a, m - 1, d, hh, mm).toISOString()
}

// ISO do banco -> 'HH:MM' no horário local.
export function horaLocal(isoTz: string): string {
  return new Date(isoTz).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ISO do banco -> 'AAAA-MM-DD' no horário local.
export function dataLocalISO(isoTz: string): string {
  const dt = new Date(isoTz)
  const a = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${a}-${m}-${d}`
}

// Data de hoje (local) como 'AAAA-MM-DD'.
export function hojeISO(): string {
  return dataLocalISO(new Date().toISOString())
}

// Soma dias a uma data 'AAAA-MM-DD'.
export function somarDias(dataISO: string, n: number): string {
  const [a, m, d] = dataISO.split('-').map(Number)
  const dt = new Date(a, m - 1, d + n)
  const aa = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${aa}-${mm}-${dd}`
}

// 'AAAA-MM-DD' -> 'qua, 19 de jun de 2026'
export function dataPorExtenso(dataISO: string): string {
  const [a, m, d] = dataISO.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
