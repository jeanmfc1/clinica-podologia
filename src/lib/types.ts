// Tipos das tabelas do banco (espelham o schema do Supabase).

export type Paciente = {
  id: string
  clinica_id: string
  nome: string
  telefone: string | null
  email: string | null
  nascimento: string | null // 'YYYY-MM-DD'
  documento: string | null
  endereco: string | null
  observacoes: string | null
  foto_url: string | null
  created_at: string
  updated_at: string
}

// Campos editáveis ao criar/atualizar um paciente.
// clinica_id é preenchido automaticamente pelo banco.
export type PacienteInput = {
  nome: string
  telefone?: string | null
  email?: string | null
  nascimento?: string | null
  documento?: string | null
  endereco?: string | null
  observacoes?: string | null
}

export type Procedimento = {
  id: string
  clinica_id: string
  nome: string
  preco: number
  duracao_min: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export type ProcedimentoInput = {
  nome: string
  preco: number
  duracao_min: number
  ativo?: boolean
}

export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'atendido'
  | 'faltou'
  | 'cancelado'

export type Agendamento = {
  id: string
  clinica_id: string
  paciente_id: string | null
  procedimento_id: string | null
  profissional_id: string
  inicio: string
  fim: string
  status: StatusAgendamento
  observacao: string | null
  created_at: string
  updated_at: string
}

// Agendamento com nome do paciente e do procedimento (via join).
export type AgendamentoComNomes = Agendamento & {
  paciente: { nome: string } | null
  procedimento: { nome: string; preco: number } | null
}

export type AgendamentoInput = {
  paciente_id: string | null
  procedimento_id: string | null
  inicio: string
  fim: string
  status: StatusAgendamento
  observacao?: string | null
}
