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
