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

// Item da consulta: um procedimento (uma consulta pode ter vários).
export type ItemConsulta = {
  procedimento_id: string | null
  nome: string
  preco: number
  duracao_min: number
}

// Agendamento com nome do paciente e dos procedimentos (via join).
// `procedimento` = o principal (compatibilidade); `itens` = todos.
export type AgendamentoComNomes = Agendamento & {
  paciente: { nome: string; telefone: string | null } | null
  procedimento: { nome: string; preco: number } | null
  itens: ItemConsulta[] | null
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
export type TipoLancamento = 'entrada' | 'saida'
export type StatusPagamento = 'pago' | 'pendente' // pendente = fiado / a receber

export type Pagamento = {
  id: string
  clinica_id: string
  agendamento_id: string | null
  paciente_id: string | null
  tipo: TipoLancamento
  categoria: string | null
  descricao: string | null
  valor: number
  forma: FormaPagamento
  status: StatusPagamento
  vencimento: string | null // 'YYYY-MM-DD' (data pra receber/pagar)
  data: string
  created_at: string
}

export type PagamentoComPaciente = Pagamento & {
  paciente: { nome: string } | null
}

export type PagamentoInput = {
  paciente_id?: string | null
  agendamento_id?: string | null
  tipo: TipoLancamento
  categoria?: string | null
  descricao?: string | null
  valor: number
  forma: FormaPagamento
  status: StatusPagamento
  vencimento?: string | null
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

// Mapa podológico: achado por pé/região, ligado a um atendimento.
export type MapaPodologico = {
  id: string
  clinica_id: string
  atendimento_id: string
  pe: 'D' | 'E'
  regiao: string
  achado: string
  observacao: string | null
  created_at: string
}

export type MapaInput = {
  atendimento_id: string
  pe: 'D' | 'E'
  regiao: string
  achado: string
  observacao?: string | null
}

// Anamnese: ficha de saúde do paciente (uma por paciente). Respostas flexíveis.
export type Anamnese = {
  id: string
  clinica_id: string
  paciente_id: string
  respostas_json: Record<string, unknown>
  atualizado_em: string
}

// ----- Estoque -----

// 'unidade': conta por unidade (baixa 1 por uso).
// 'lote': líquido/creme — conta usos por frasco aberto (ver Lote).
export type TipoEstoque = 'unidade' | 'lote'

// Item de estoque (material): quantidade atual e mínimo pra avisar.
// Em 'lote', quantidade = frascos de reserva (fechados) e unidade = ml/g.
export type ItemEstoque = {
  id: string
  clinica_id: string
  nome: string
  categoria: string | null
  unidade: string
  quantidade: number
  minimo: number
  tipo: TipoEstoque
  tamanho_lote: number | null
  preco: number
  observacao: string | null
  created_at: string
  updated_at: string
}

// clinica_id é preenchido automaticamente pelo banco.
export type ItemEstoqueInput = {
  nome: string
  categoria?: string | null
  unidade?: string
  quantidade?: number
  minimo?: number
  tipo?: TipoEstoque
  tamanho_lote?: number | null
  preco?: number
  observacao?: string | null
}

// Frasco de um item 'lote'. Conta usos; fecha quando acaba.
export type Lote = {
  id: string
  clinica_id: string
  estoque_id: string
  rotulo: string | null
  tamanho: number | null
  usos: number
  aberto_em: string
  fechado_em: string | null
  created_at: string
}

// Material usado num atendimento (baixa o estoque). nome/unidade são "foto"
// do momento, pra continuar legível mesmo se o item sair do estoque.
// Em item 'lote', quantidade = nº de usos e lote_id aponta o frasco.
export type MaterialUsado = {
  id: string
  clinica_id: string
  atendimento_id: string
  estoque_id: string | null
  lote_id: string | null
  nome: string
  unidade: string
  quantidade: number
  created_at: string
}
