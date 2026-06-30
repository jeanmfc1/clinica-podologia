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
  origem: 'manual' | 'online'
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

// ----- Prontuário -----

// Atendimento (evolução): o registro do que foi feito numa consulta.
export type Atendimento = {
  id: string
  clinica_id: string
  paciente_id: string
  agendamento_id: string | null
  profissional_id: string
  data: string
  evolucao: string | null
  created_at: string
  updated_at: string
}

// clinica_id e profissional_id são preenchidos automaticamente pelo banco.
export type AtendimentoInput = {
  paciente_id: string
  agendamento_id?: string | null
  data: string
  evolucao?: string | null
}

// ----- Financeiro -----
export type FormaPagamento = 'dinheiro' | 'pix' | 'credito' | 'debito' | 'outro'

export type Pagamento = {
  id: string
  clinica_id: string
  agendamento_id: string | null
  paciente_id: string | null
  descricao: string | null
  valor: number
  forma: FormaPagamento
  data: string
  created_at: string
}

export type PagamentoComPaciente = Pagamento & {
  paciente: { nome: string } | null
}

export type PagamentoInput = {
  paciente_id?: string | null
  agendamento_id?: string | null
  descricao?: string | null
  valor: number
  forma: FormaPagamento
  data: string
}

// Foto clínica (antes/depois) ligada a um atendimento.
export type FotoClinica = {
  id: string
  clinica_id: string
  atendimento_id: string
  storage_path: string
  momento: 'antes' | 'depois'
  consentimento_em: string | null
  created_at: string
}

// Anamnese: ficha de saúde do paciente (uma por paciente). Respostas flexíveis.
export type Anamnese = {
  id: string
  clinica_id: string
  paciente_id: string
  respostas_json: Record<string, unknown>
  atualizado_em: string
}
