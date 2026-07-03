import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type {
  ItemEstoque,
  ItemEstoqueInput,
  Lote,
  MaterialUsado,
  TipoEstoque,
} from '../../lib/types'

const CHAVE = 'estoque'
const CHAVE_MAT = 'atendimento_materiais'
const CHAVE_LOTES = 'estoque_lotes'

// Sugestões de unidade e categoria (campos livres; isto só ajuda no formulário).
export const UNIDADES = ['un', 'cx', 'par', 'cm', 'm', 'ml', 'g', 'kg', 'rolo']
export const CATEGORIAS_ESTOQUE = [
  'Lâminas',
  'Cremes e loções',
  'Antissépticos',
  'Curativos',
  'Descartáveis',
  'Instrumentos',
  'Limpeza',
  'Outro',
]

// Um item está acabando quando a quantidade chegou (ou passou) do mínimo.
export function estaFaltando(item: ItemEstoque): boolean {
  return item.minimo > 0 && item.quantidade <= item.minimo
}

// Lista o estoque: itens que estão faltando primeiro, depois por nome.
export function useEstoque() {
  return useQuery({
    queryKey: [CHAVE],
    queryFn: async (): Promise<ItemEstoque[]> => {
      const { data, error } = await supabase.from('estoque').select('*').order('nome')
      if (error) throw error
      const itens = (data ?? []) as ItemEstoque[]
      return itens.sort((a, b) => {
        const fa = estaFaltando(a) ? 0 : 1
        const fb = estaFaltando(b) ? 0 : 1
        return fa - fb || a.nome.localeCompare(b.nome, 'pt-BR')
      })
    },
  })
}

export function useItemEstoque(id: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, id],
    enabled: !!id,
    queryFn: async (): Promise<ItemEstoque> => {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCriarItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ItemEstoqueInput) => {
      const { error } = await supabase.from('estoque').insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useAtualizarItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; input: ItemEstoqueInput }) => {
      const { error } = await supabase
        .from('estoque')
        .update({ ...args.input, updated_at: new Date().toISOString() })
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

// Ajuste rápido da quantidade (botões + / − na lista). Nunca deixa negativo.
export function useAjustarQuantidade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; atual: number; delta: number }) => {
      const nova = Math.max(0, args.atual + args.delta)
      const { error } = await supabase
        .from('estoque')
        .update({ quantidade: nova, updated_at: new Date().toISOString() })
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useExcluirItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('estoque').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

// Carrega vários itens de uma vez (botão "carregar inventário").
// Abre um lote inicial pros itens 'lote' (eles já estão "em uso").
export function useSeedEstoque() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (lista: ItemEstoqueInput[]) => {
      const { data, error } = await supabase.from('estoque').insert(lista).select()
      if (error) throw error
      const criados = (data ?? []) as ItemEstoque[]
      const lotes = criados
        .filter((i) => i.tipo === 'lote')
        .map((i) => ({ estoque_id: i.id, tamanho: i.tamanho_lote, usos: 0 }))
      if (lotes.length) {
        const { error: e2 } = await supabase.from('estoque_lotes').insert(lotes)
        if (e2) throw e2
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

// ---------- Lotes (frascos) dos itens 'lote' ----------

// Lote aberto (em uso) mais recente de um item — ou null se não há.
async function loteAberto(estoqueId: string): Promise<Lote | null> {
  const { data } = await supabase
    .from('estoque_lotes')
    .select('*')
    .eq('estoque_id', estoqueId)
    .is('fechado_em', null)
    .order('aberto_em', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as Lote) ?? null
}

// Abre um novo lote e (se pedido) consome 1 frasco da reserva.
async function abrirLoteInterno(
  estoqueId: string,
  tamanho: number | null,
  daReserva: boolean,
): Promise<Lote> {
  const { data, error } = await supabase
    .from('estoque_lotes')
    .insert({ estoque_id: estoqueId, tamanho, usos: 0 })
    .select()
    .single()
  if (error) throw error
  if (daReserva) await ajustarEstoque(estoqueId, -1)
  return data as Lote
}

// Lote aberto (mais recente) de cada item, num mapa estoque_id -> Lote.
// Serve pra mostrar "frasco aberto: N usos" na lista do estoque.
export function useLotesAbertos() {
  return useQuery({
    queryKey: [CHAVE_LOTES, 'abertos'],
    queryFn: async (): Promise<Record<string, Lote>> => {
      const { data, error } = await supabase
        .from('estoque_lotes')
        .select('*')
        .is('fechado_em', null)
      if (error) throw error
      const mapa: Record<string, Lote> = {}
      for (const l of (data ?? []) as Lote[]) {
        const atual = mapa[l.estoque_id]
        if (!atual || new Date(l.aberto_em) > new Date(atual.aberto_em)) {
          mapa[l.estoque_id] = l
        }
      }
      return mapa
    },
  })
}

export function useLotesDoItem(estoqueId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE_LOTES, estoqueId],
    enabled: !!estoqueId,
    queryFn: async (): Promise<Lote[]> => {
      const { data, error } = await supabase
        .from('estoque_lotes')
        .select('*')
        .eq('estoque_id', estoqueId!)
        .order('aberto_em', { ascending: false })
      if (error) throw error
      return (data ?? []) as Lote[]
    },
  })
}

// Abre um novo frasco manualmente (consome 1 da reserva).
export function useAbrirLote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { estoqueId: string; tamanho: number | null }) => {
      await abrirLoteInterno(args.estoqueId, args.tamanho, true)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHAVE_LOTES] })
      qc.invalidateQueries({ queryKey: [CHAVE] })
    },
  })
}

// Fecha um frasco ("acabou").
export function useFecharLote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (loteId: string) => {
      const { error } = await supabase
        .from('estoque_lotes')
        .update({ fechado_em: new Date().toISOString() })
        .eq('id', loteId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE_LOTES] }),
  })
}

// ---------- Materiais usados no atendimento (baixa o estoque) ----------

// Soma um delta à quantidade de um item (não deixa negativo). Ignora se o
// item não existe mais no estoque (estoqueId nulo).
async function ajustarEstoque(estoqueId: string | null, delta: number) {
  if (!estoqueId) return
  const { data } = await supabase
    .from('estoque')
    .select('quantidade')
    .eq('id', estoqueId)
    .maybeSingle()
  if (!data) return
  const nova = Math.max(0, Number(data.quantidade) + delta)
  await supabase
    .from('estoque')
    .update({ quantidade: nova, updated_at: new Date().toISOString() })
    .eq('id', estoqueId)
}

export function useMateriaisDoAtendimento(atendimentoId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE_MAT, atendimentoId],
    enabled: !!atendimentoId,
    queryFn: async (): Promise<MaterialUsado[]> => {
      const { data, error } = await supabase
        .from('atendimento_materiais')
        .select('*')
        .eq('atendimento_id', atendimentoId!)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as MaterialUsado[]
    },
  })
}

// Registra um material usado.
// - 'unidade': grava a quantidade e baixa do estoque.
// - 'lote': soma os usos no frasco aberto (abre um se não houver) e, se
//   marcado, fecha o frasco ("acabou").
export function useRegistrarMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      atendimentoId: string
      estoqueId: string | null
      tipo: TipoEstoque
      nome: string
      unidade: string
      quantidade: number
      tamanhoLote?: number | null
      fecharLote?: boolean
    }) => {
      if (args.tipo === 'lote' && args.estoqueId) {
        // Garante um frasco aberto (o primeiro uso abre um da reserva).
        let lote = await loteAberto(args.estoqueId)
        if (!lote) {
          lote = await abrirLoteInterno(args.estoqueId, args.tamanhoLote ?? null, true)
        }
        await supabase
          .from('estoque_lotes')
          .update({ usos: Number(lote.usos) + args.quantidade })
          .eq('id', lote.id)
        const { error } = await supabase.from('atendimento_materiais').insert({
          atendimento_id: args.atendimentoId,
          estoque_id: args.estoqueId,
          lote_id: lote.id,
          nome: args.nome,
          unidade: 'uso',
          quantidade: args.quantidade,
        })
        if (error) throw error
        if (args.fecharLote) {
          await supabase
            .from('estoque_lotes')
            .update({ fechado_em: new Date().toISOString() })
            .eq('id', lote.id)
        }
      } else {
        const { error } = await supabase.from('atendimento_materiais').insert({
          atendimento_id: args.atendimentoId,
          estoque_id: args.estoqueId,
          nome: args.nome,
          unidade: args.unidade,
          quantidade: args.quantidade,
        })
        if (error) throw error
        await ajustarEstoque(args.estoqueId, -args.quantidade)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHAVE_MAT] })
      qc.invalidateQueries({ queryKey: [CHAVE] })
      qc.invalidateQueries({ queryKey: [CHAVE_LOTES] })
    },
  })
}

// Remove um material do atendimento e desfaz o efeito.
// - 'unidade': devolve a quantidade ao estoque.
// - 'lote': desconta os usos do frasco (não reabre lote fechado nem devolve reserva).
export function useExcluirMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mat: MaterialUsado) => {
      const { error } = await supabase
        .from('atendimento_materiais')
        .delete()
        .eq('id', mat.id)
      if (error) throw error
      if (mat.lote_id) {
        const { data } = await supabase
          .from('estoque_lotes')
          .select('usos')
          .eq('id', mat.lote_id)
          .maybeSingle()
        if (data) {
          await supabase
            .from('estoque_lotes')
            .update({ usos: Math.max(0, Number(data.usos) - mat.quantidade) })
            .eq('id', mat.lote_id)
        }
      } else {
        await ajustarEstoque(mat.estoque_id, mat.quantidade)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHAVE_MAT] })
      qc.invalidateQueries({ queryKey: [CHAVE] })
      qc.invalidateQueries({ queryKey: [CHAVE_LOTES] })
    },
  })
}
