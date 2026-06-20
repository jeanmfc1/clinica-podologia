// Funções de formatação no padrão brasileiro.

// Telefone: 5562999999999 -> (62) 99999-9999
export function formatTelefone(valor: string | null | undefined): string {
  if (!valor) return ''
  const d = valor.replace(/\D/g, '').replace(/^55/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return valor
}

// Só os dígitos, com DDI 55, para usar em links wa.me.
export function telefoneParaWhatsapp(valor: string | null | undefined): string | null {
  if (!valor) return null
  let d = valor.replace(/\D/g, '')
  if (d.length <= 11) d = '55' + d
  return d
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
