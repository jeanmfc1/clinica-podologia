// Monta a mensagem de lembrete da consulta e o link do WhatsApp.
// Abre o WhatsApp já com o texto pronto (não envia sozinho: a Simeire confere e
// toca em enviar). Funciona no celular e no computador, sem custo nem backend.
import { clinica } from '../../config'
import {
  dataLocalISO,
  dataPorExtenso,
  horaLocal,
  linkWhatsapp,
} from '../../lib/format'
import type { AgendamentoComNomes } from '../../lib/types'

// Só o primeiro nome, pra deixar a mensagem mais pessoal.
function primeiroNome(nome: string | undefined | null): string {
  return (nome ?? '').trim().split(/\s+/)[0] || 'tudo bem'
}

// Texto amigável do lembrete, na voz da clínica.
export function textoLembrete(a: AgendamentoComNomes): string {
  const nome = primeiroNome(a.paciente?.nome)
  const dia = dataPorExtenso(dataLocalISO(a.inicio))
  const hora = horaLocal(a.inicio)
  const linhas = [
    `Olá, ${nome}! 😊`,
    '',
    `Passando pra lembrar da sua consulta na ${clinica.nome}:`,
    `🗓️ ${dia} às ${hora}`,
  ]
  if (a.procedimento?.nome) linhas.push(`💅 ${a.procedimento.nome}`)
  linhas.push('', 'Qualquer coisa, é só responder por aqui. Até lá! 💙')
  return linhas.join('\n')
}

// Link wa.me com o lembrete pronto — ou null se o paciente não tem telefone.
export function linkLembrete(a: AgendamentoComNomes): string | null {
  return linkWhatsapp(a.paciente?.telefone, textoLembrete(a))
}
