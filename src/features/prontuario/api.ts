import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type {
  Anamnese,
  Atendimento,
  AtendimentoInput,
  FotoClinica,
  MapaInput,
  MapaPodologico,
} from '../../lib/types'

const BUCKET = 'clinicos'

const CHAVE = 'atendimentos'

// Histórico de atendimentos (evolução) de um paciente, do mais novo ao mais antigo.
export function useAtendimentosDoPaciente(pacienteId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'paciente', pacienteId],
    enabled: !!pacienteId,
    queryFn: async (): Promise<Atendimento[]> => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('paciente_id', pacienteId!)
        .order('data', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useAtendimento(id: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, id],
    enabled: !!id,
    queryFn: async (): Promise<Atendimento> => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCriarAtendimento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AtendimentoInput): Promise<Atendimento> => {
      const { data, error } = await supabase
        .from('atendimentos')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useAtualizarAtendimento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; input: Partial<AtendimentoInput> }) => {
      const { error } = await supabase
        .from('atendimentos')
        .update({ ...args.input, updated_at: new Date().toISOString() })
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export function useExcluirAtendimento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('atendimentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

// ----- Anamnese (uma por paciente) -----
export function useAnamnese(pacienteId: string | undefined) {
  return useQuery({
    queryKey: ['anamnese', pacienteId],
    enabled: !!pacienteId,
    queryFn: async (): Promise<Anamnese | null> => {
      const { data, error } = await supabase
        .from('anamneses')
        .select('*')
        .eq('paciente_id', pacienteId!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useSalvarAnamnese() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      pacienteId: string
      respostas: Record<string, unknown>
    }) => {
      const { error } = await supabase.from('anamneses').upsert(
        {
          paciente_id: args.pacienteId,
          respostas_json: args.respostas,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'paciente_id' },
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anamnese'] }),
  })
}

// ----- Fotos clínicas (antes/depois) de um atendimento -----
export type FotoComUrl = FotoClinica & { url: string | null }

export function useFotosDoAtendimento(atendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['fotos', atendimentoId],
    enabled: !!atendimentoId,
    queryFn: async (): Promise<FotoComUrl[]> => {
      const { data: rows, error } = await supabase
        .from('fotos_clinicas')
        .select('*')
        .eq('atendimento_id', atendimentoId!)
        .order('created_at')
      if (error) throw error
      const fotos = (rows ?? []) as FotoClinica[]
      if (fotos.length === 0) return []
      // Bucket é privado: gera links assinados temporários pra exibir.
      const { data: assinadas } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(fotos.map((f) => f.storage_path), 3600)
      return fotos.map((f, i) => ({ ...f, url: assinadas?.[i]?.signedUrl ?? null }))
    },
  })
}

export function useEnviarFoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      clinicaId: string
      atendimentoId: string
      file: File
      momento: 'antes' | 'depois'
    }) => {
      const ext = (args.file.name.split('.').pop() || 'jpg').toLowerCase()
      const nome = `${crypto.randomUUID()}.${ext}`
      // Caminho exigido pela segurança: <clinica_id>/<atendimento_id>/<arquivo>
      const path = `${args.clinicaId}/${args.atendimentoId}/${nome}`
      const up = await supabase.storage.from(BUCKET).upload(path, args.file, { upsert: false })
      if (up.error) throw up.error
      const { error } = await supabase.from('fotos_clinicas').insert({
        atendimento_id: args.atendimentoId,
        storage_path: path,
        momento: args.momento,
        consentimento_em: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fotos'] }),
  })
}

export function useExcluirFoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (foto: FotoClinica) => {
      await supabase.storage.from(BUCKET).remove([foto.storage_path])
      const { error } = await supabase.from('fotos_clinicas').delete().eq('id', foto.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fotos'] }),
  })
}

// ----- Mapa podológico (achados por pé) -----
export const REGIOES = [
  'Hálux',
  '2º dedo',
  '3º dedo',
  '4º dedo',
  '5º dedo',
  'Unha',
  'Sulco lateral',
  'Planta',
  'Calcanhar',
  'Lateral',
  'Entre os dedos',
]

export const ACHADOS = [
  'Calo',
  'Cravo',
  'Unha encravada',
  'Micose (pele)',
  'Micose (unha)',
  'Fissura/rachadura',
  'Ferida',
  'Bolha',
  'Verruga',
  'Ressecamento',
]

export function useMapaDoAtendimento(atendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['mapa', atendimentoId],
    enabled: !!atendimentoId,
    queryFn: async (): Promise<MapaPodologico[]> => {
      const { data, error } = await supabase
        .from('mapa_podologico')
        .select('*')
        .eq('atendimento_id', atendimentoId!)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as MapaPodologico[]
    },
  })
}

export function useCriarMapa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: MapaInput) => {
      const { error } = await supabase.from('mapa_podologico').insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapa'] }),
  })
}

export function useExcluirMapa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mapa_podologico').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapa'] }),
  })
}

// Perguntas da anamnese — fáceis de ajustar depois.
export const ANAMNESE_SIM_NAO: { chave: string; rotulo: string }[] = [
  { chave: 'diabetes', rotulo: 'Diabetes' },
  { chave: 'hipertensao', rotulo: 'Pressão alta' },
  { chave: 'circulacao', rotulo: 'Problema de circulação' },
  { chave: 'cardiaco', rotulo: 'Problema cardíaco' },
  { chave: 'renal', rotulo: 'Problema nos rins' },
  { chave: 'hepatite', rotulo: 'Hepatite' },
  { chave: 'cancer', rotulo: 'Câncer' },
  { chave: 'gestante', rotulo: 'Gestante' },
  { chave: 'fumante', rotulo: 'Fumante' },
  { chave: 'marcapasso', rotulo: 'Usa marcapasso' },
  { chave: 'ferida_cicatrizacao', rotulo: 'Já teve ferida que demorou a cicatrizar' },
  { chave: 'formigamento', rotulo: 'Formigamento ou dormência nos pés' },
  { chave: 'unha_encravada', rotulo: 'Unha encravada com frequência' },
]

export const ANAMNESE_TEXTO: { chave: string; rotulo: string }[] = [
  { chave: 'profissao', rotulo: 'Profissão / ocupação' },
  { chave: 'alergias', rotulo: 'Alergias' },
  { chave: 'medicamentos', rotulo: 'Medicamentos em uso' },
  { chave: 'cirurgias', rotulo: 'Cirurgias / outras condições' },
  { chave: 'calcado', rotulo: 'Tipo de calçado que usa no dia a dia' },
  { chave: 'atividade_fisica', rotulo: 'Prática de atividade física' },
  { chave: 'observacoes', rotulo: 'Observações gerais' },
]
