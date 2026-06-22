// Configuração da clínica.
// Estes valores aparecem no app (título, contato, etc.).
export const clinica = {
  nome: 'Pés de Anjo',
  profissional: 'Simeire Ferreira',
  cidadeUf: 'Ceres, GO',
  // WhatsApp em formato internacional só com dígitos (DDI + DDD + número).
  // Conferir: número de celular costuma ter o "9" antes (ex.: 5562993241794).
  whatsapp: '556293241794',
  corTema: '#0f766e',
  logoUrl: '/logo.png',
} as const

// Horários de trabalho (para o agendamento online — define os horários livres
// que os pacientes verão). A Simeire pode marcar fora disso manualmente.
// Dia da semana: 0=domingo … 6=sábado.
export const horarioTrabalho: Record<
  number,
  { inicio: string; fim: string; almoco?: { inicio: string; fim: string } } | null
> = {
  0: null, // domingo: fechado
  1: { inicio: '08:00', fim: '17:00', almoco: { inicio: '11:00', fim: '13:00' } },
  2: { inicio: '08:00', fim: '17:00', almoco: { inicio: '11:00', fim: '13:00' } },
  3: { inicio: '08:00', fim: '17:00', almoco: { inicio: '11:00', fim: '13:00' } },
  4: { inicio: '08:00', fim: '17:00', almoco: { inicio: '11:00', fim: '13:00' } },
  5: { inicio: '08:00', fim: '17:00', almoco: { inicio: '11:00', fim: '13:00' } },
  6: { inicio: '08:00', fim: '12:00' }, // sábado
}
