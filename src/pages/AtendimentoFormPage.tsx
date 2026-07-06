import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  useAtendimento,
  useAtualizarAtendimento,
  useCriarAtendimento,
  useExcluirAtendimento,
  useEnviarFoto,
  useExcluirFoto,
  useFotosDoAtendimento,
  useMapaDoAtendimento,
  useCriarMapa,
  useExcluirMapa,
  REGIOES,
  ACHADOS,
  type FotoComUrl,
} from '../features/prontuario/api'
import { usePaciente } from '../features/pacientes/api'
import { useAgendamento, useCriarAgendamento, useMudarStatus } from '../features/agenda/api'
import { FORMAS, useCriarPagamento } from '../features/financeiro/api'
import {
  useEstoque,
  useExcluirMaterial,
  useMateriaisDoAtendimento,
  useRegistrarMaterial,
  useVenderProduto,
} from '../features/estoque/api'
import type {
  FormaPagamento,
  MapaPodologico,
  MaterialUsado,
  StatusPagamento,
} from '../lib/types'
import {
  combinarDataHora,
  dataLocalISO,
  formatReal,
  horaLocal,
  hojeISO,
  somarDias,
} from '../lib/format'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'
import { DateInputBR } from '../components/DateInputBR'

// Foto escolhida mas ainda não enviada (fica em espera até salvar).
type FotoPendente = {
  localId: string
  file: File
  momento: 'antes' | 'depois'
  preview: string
}

// Achado do mapa em espera (até salvar).
type MapaPendente = {
  localId: string
  pe: 'D' | 'E'
  regiao: string
  achado: string
  observacao: string
}

// Material escolhido mas ainda não gravado (baixa o estoque ao salvar).
type MaterialPendente = {
  localId: string
  estoqueId: string
  tipo: 'unidade' | 'lote'
  nome: string
  unidade: string
  quantidade: number
  tamanhoLote: number | null
  fecharLote: boolean
}

// Produto vendido no atendimento (baixa estoque + entra no financeiro ao salvar).
type ProdutoVendido = {
  localId: string
  estoqueId: string
  nome: string
  preco: number
  quantidade: number
}

// Mostra número inteiro quando não tem casas; senão, com vírgula.
function formatQtd(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR')
}

export function AtendimentoFormPage() {
  const { id, atId } = useParams() // id = paciente; atId = atendimento (ao editar)
  const editando = !!atId
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const agendamentoId = params.get('agendamento')

  const { data: paciente } = usePaciente(id)
  const { data: atendimento } = useAtendimento(atId)
  // Consulta ligada: pelo link (criar) ou pelo próprio atendimento (editar).
  const agId = agendamentoId ?? atendimento?.agendamento_id ?? undefined
  const { data: agendamento } = useAgendamento(agId)
  const criarPagamento = useCriarPagamento()
  const criarAgendamento = useCriarAgendamento()
  const mudarStatus = useMudarStatus()
  const criar = useCriarAtendimento()
  const atualizar = useAtualizarAtendimento()
  const excluir = useExcluirAtendimento()
  const { data: fotos } = useFotosDoAtendimento(atId)
  const enviarFoto = useEnviarFoto()
  const excluirFoto = useExcluirFoto()
  const { data: mapa } = useMapaDoAtendimento(atId)
  const criarMapa = useCriarMapa()
  const excluirMapa = useExcluirMapa()
  const { data: estoque } = useEstoque()
  const { data: materiais } = useMateriaisDoAtendimento(atId)
  const registrarMaterial = useRegistrarMaterial()
  const excluirMaterial = useExcluirMaterial()
  const venderProduto = useVenderProduto()

  const agora = new Date()
  const [data, setData] = useState(hojeISO())
  const [hora, setHora] = useState(
    `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`,
  )
  const [evolucao, setEvolucao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [momento, setMomento] = useState<'antes' | 'depois'>('antes')
  const [pendentes, setPendentes] = useState<FotoPendente[]>([])
  const [salvando, setSalvando] = useState(false)

  // Pagamento registrado junto (só ao criar um atendimento novo).
  const [registrarPag, setRegistrarPag] = useState(true)
  const [valorPag, setValorPag] = useState('')
  const [formaPag, setFormaPag] = useState<FormaPagamento>('dinheiro')
  const [statusPag, setStatusPag] = useState<StatusPagamento>('pago')
  const [vencimentoPag, setVencimentoPag] = useState('')

  // Retorno (cria a próxima consulta ao salvar).
  const [agendarRetorno, setAgendarRetorno] = useState(false)
  const [dataRetorno, setDataRetorno] = useState(somarDias(hojeISO(), 30))
  const [horaRetorno, setHoraRetorno] = useState('09:00')

  // Mapa do pé (achados em espera + campos do novo achado).
  const [mapaPendentes, setMapaPendentes] = useState<MapaPendente[]>([])
  const [peNovo, setPeNovo] = useState<'D' | 'E'>('D')
  const [regiaoNova, setRegiaoNova] = useState('')
  const [achadoNovo, setAchadoNovo] = useState('')
  const [obsMapa, setObsMapa] = useState('')

  // Materiais usados (em espera até salvar) + campos do novo material.
  const [materiaisPendentes, setMateriaisPendentes] = useState<MaterialPendente[]>([])
  const [matSelId, setMatSelId] = useState('')
  const [matQtd, setMatQtd] = useState('1')
  const [matFecharLote, setMatFecharLote] = useState(false)
  const matSelecionado = (estoque ?? []).find((e) => e.id === matSelId)
  const matEhLote = matSelecionado?.tipo === 'lote'

  function adicionarMaterial() {
    if (!matSelecionado) return
    const q = parseFloat(matQtd.replace(',', '.')) || 0
    if (q <= 0) return
    setMateriaisPendentes((l) => [
      ...l,
      {
        localId: crypto.randomUUID(),
        estoqueId: matSelecionado.id,
        tipo: matSelecionado.tipo,
        nome: matSelecionado.nome,
        unidade: matSelecionado.tipo === 'lote' ? 'uso' : matSelecionado.unidade,
        quantidade: q,
        tamanhoLote: matSelecionado.tamanho_lote,
        fecharLote: matSelecionado.tipo === 'lote' ? matFecharLote : false,
      },
    ])
    setMatSelId('')
    setMatQtd('1')
    setMatFecharLote(false)
  }

  function removerMaterialPendente(localId: string) {
    setMateriaisPendentes((l) => l.filter((m) => m.localId !== localId))
  }

  // Produtos vendidos no atendimento.
  const produtosVenda = (estoque ?? []).filter((e) => e.preco > 0)
  const [produtosVendidos, setProdutosVendidos] = useState<ProdutoVendido[]>([])
  const [prodSelId, setProdSelId] = useState('')
  const [prodQtd, setProdQtd] = useState('1')
  const [prodForma, setProdForma] = useState<FormaPagamento>('dinheiro')
  const [prodStatus, setProdStatus] = useState<StatusPagamento>('pago')
  const prodSelecionado = produtosVenda.find((e) => e.id === prodSelId)

  function adicionarProduto() {
    if (!prodSelecionado) return
    const q = parseInt(prodQtd, 10) || 0
    if (q <= 0) return
    setProdutosVendidos((l) => [
      ...l,
      {
        localId: crypto.randomUUID(),
        estoqueId: prodSelecionado.id,
        nome: prodSelecionado.nome,
        preco: prodSelecionado.preco,
        quantidade: q,
      },
    ])
    setProdSelId('')
    setProdQtd('1')
  }

  function removerProduto(localId: string) {
    setProdutosVendidos((l) => l.filter((p) => p.localId !== localId))
  }
  const totalProdutos = produtosVendidos.reduce((s, p) => s + p.preco * p.quantidade, 0)

  function adicionarAchado() {
    if (!regiaoNova.trim() || !achadoNovo.trim()) return
    setMapaPendentes((l) => [
      ...l,
      {
        localId: crypto.randomUUID(),
        pe: peNovo,
        regiao: regiaoNova.trim(),
        achado: achadoNovo.trim(),
        observacao: obsMapa.trim(),
      },
    ])
    setRegiaoNova('')
    setAchadoNovo('')
    setObsMapa('')
  }

  function removerMapaPendente(localId: string) {
    setMapaPendentes((l) => l.filter((m) => m.localId !== localId))
  }
  const inputCamera = useRef<HTMLInputElement>(null)
  const inputGaleria = useRef<HTMLInputElement>(null)

  // Escolher fotos: ficam em espera (com preview) até salvar o atendimento.
  function aoEscolherFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!arquivos.length) return
    setPendentes((lista) => [
      ...lista,
      ...arquivos.map((file) => ({
        localId: crypto.randomUUID(),
        file,
        momento,
        preview: URL.createObjectURL(file),
      })),
    ])
  }

  function removerPendente(localId: string) {
    setPendentes((lista) => {
      const alvo = lista.find((p) => p.localId === localId)
      if (alvo) URL.revokeObjectURL(alvo.preview)
      return lista.filter((p) => p.localId !== localId)
    })
  }

  // Preenche ao editar.
  useEffect(() => {
    if (atendimento) {
      setData(dataLocalISO(atendimento.data))
      setHora(horaLocal(atendimento.data))
      setEvolucao(atendimento.evolucao ?? '')
    }
  }, [atendimento])

  // Puxa o valor do procedimento da consulta pro pagamento.
  useEffect(() => {
    if (agendamento?.procedimento?.preco != null) {
      setValorPag(String(agendamento.procedimento.preco).replace('.', ','))
    }
  }, [agendamento])

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!evolucao.trim()) return setErro('Escreva a evolução do atendimento.')
    if (!id) return setErro('Paciente não identificado.')

    const dataHora = combinarDataHora(data, hora)
    setSalvando(true)
    try {
      // 1) Cria ou atualiza o atendimento (e descobre o id + a clínica).
      let atendimentoId = atId
      let clinicaId = atendimento?.clinica_id
      if (editando) {
        await atualizar.mutateAsync({
          id: atId!,
          input: { data: dataHora, evolucao: evolucao.trim() },
        })
      } else {
        const novo = await criar.mutateAsync({
          paciente_id: id,
          agendamento_id: agendamentoId,
          data: dataHora,
          evolucao: evolucao.trim(),
        })
        atendimentoId = novo.id
        clinicaId = novo.clinica_id
      }

      // Marca a consulta ligada como "atendido" (atualiza agenda e Google).
      if (!editando && agendamentoId) {
        await mudarStatus.mutateAsync({ id: agendamentoId, status: 'atendido' })
      }

      // 2) Envia as fotos que estavam em espera.
      if (atendimentoId && clinicaId) {
        for (const p of pendentes) {
          await enviarFoto.mutateAsync({
            clinicaId,
            atendimentoId,
            file: p.file,
            momento: p.momento,
          })
        }
      }

      // 3) Registra o pagamento (só ao criar, se marcado e com valor).
      if (!editando && registrarPag) {
        const v = parseFloat(valorPag.replace(/\./g, '').replace(',', '.'))
        if (!isNaN(v) && v > 0) {
          await criarPagamento.mutateAsync({
            tipo: 'entrada',
            valor: v,
            categoria: 'Consulta',
            forma: formaPag,
            status: statusPag,
            vencimento: statusPag === 'pendente' ? vencimentoPag || null : null,
            data: dataHora,
            paciente_id: id,
            agendamento_id: agendamentoId,
            descricao: agendamento?.procedimento?.nome ?? null,
          })
        }
      }

      // Salva os achados do mapa do pé.
      if (atendimentoId) {
        for (const m of mapaPendentes) {
          await criarMapa.mutateAsync({
            atendimento_id: atendimentoId,
            pe: m.pe,
            regiao: m.regiao,
            achado: m.achado,
            observacao: m.observacao || null,
          })
        }
      }

      // Grava os materiais usados (baixa o estoque / conta usos no lote).
      if (atendimentoId) {
        for (const m of materiaisPendentes) {
          await registrarMaterial.mutateAsync({
            atendimentoId,
            estoqueId: m.estoqueId,
            tipo: m.tipo,
            nome: m.nome,
            unidade: m.unidade,
            quantidade: m.quantidade,
            tamanhoLote: m.tamanhoLote,
            fecharLote: m.fecharLote,
          })
        }
      }

      // Vende os produtos escolhidos (baixa estoque + entra no financeiro).
      for (const p of produtosVendidos) {
        await venderProduto.mutateAsync({
          estoqueId: p.estoqueId,
          nome: p.nome,
          quantidade: p.quantidade,
          valorUnitario: p.preco,
          forma: prodForma,
          status: prodStatus,
          pacienteId: id,
          data: dataHora,
        })
      }

      // 4) Agenda o retorno (cria a próxima consulta), se marcado.
      if (!editando && agendarRetorno && dataRetorno) {
        const ini = combinarDataHora(dataRetorno, horaRetorno)
        const fim = new Date(new Date(ini).getTime() + 30 * 60000).toISOString()
        await criarAgendamento.mutateAsync({
          paciente_id: id,
          procedimento_id: null,
          inicio: ini,
          fim,
          status: 'agendado',
          observacao: 'Retorno',
        })
      }

      pendentes.forEach((p) => URL.revokeObjectURL(p.preview))
      navigate(`/pacientes/${id}`, { replace: true })
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  async function aoExcluir() {
    if (!confirm('Excluir este atendimento?')) return
    // Devolve ao estoque os materiais que tinham sido usados.
    for (const m of materiais ?? []) {
      await excluirMaterial.mutateAsync(m)
    }
    await excluir.mutateAsync(atId!)
    navigate(`/pacientes/${id}`, { replace: true })
  }

  const pendAntes = pendentes.filter((p) => p.momento === 'antes')
  const pendDepois = pendentes.filter((p) => p.momento === 'depois')

  return (
    <section>
      <PageHeader titulo={editando ? 'Editar atendimento' : 'Novo atendimento'} voltar />

      {paciente && (
        <p className="mb-1 text-slate-600 dark:text-slate-300">
          Paciente: <span className="font-bold text-slate-800 dark:text-slate-100">{paciente.nome}</span>
        </p>
      )}
      {agendamento?.procedimento && (
        <p className="mb-4 text-slate-600 dark:text-slate-300">
          Procedimento:{' '}
          <span className="font-bold text-slate-800 dark:text-slate-100">{agendamento.procedimento.nome}</span>
        </p>
      )}

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Campo rotulo="Data">
              <DateInputBR value={data} onChange={setData} className={inputClass} />
            </Campo>
          </div>
          <div className="w-28">
            <Campo rotulo="Hora">
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={inputClass}
              />
            </Campo>
          </div>
        </div>

        <Campo rotulo="Evolução / o que foi feito *">
          <textarea
            rows={6}
            value={evolucao}
            onChange={(e) => setEvolucao(e.target.value)}
            placeholder="Descreva o atendimento: queixa, procedimento realizado, orientações…"
            className={inputClass + ' py-2'}
          />
        </Campo>

        {/* Fotos — escolhidas aqui e enviadas junto ao salvar. */}
        <div>
          <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">Fotos</p>
          <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
            {(['antes', 'depois'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMomento(m)}
                className={
                  'min-h-[40px] rounded-md font-bold capitalize ' +
                  (momento === m ? 'bg-white dark:bg-slate-800 text-brand-700 shadow-sm' : 'text-slate-500 dark:text-slate-400')
                }
              >
                {m}
              </button>
            ))}
          </div>

          {/* Câmera (tira na hora) */}
          <input
            ref={inputCamera}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={aoEscolherFotos}
            className="hidden"
          />
          {/* Galeria (escolhe arquivos já salvos) */}
          <input
            ref={inputGaleria}
            type="file"
            accept="image/*"
            multiple
            onChange={aoEscolherFotos}
            className="hidden"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => inputCamera.current?.click()}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-400 px-3 font-bold text-brand-700"
            >
              📷 Câmera
            </button>
            <button
              type="button"
              onClick={() => inputGaleria.current?.click()}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-400 px-3 font-bold text-brand-700"
            >
              🖼️ Galeria
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Adicionando em: {momento}</p>

          {/* Em espera (ainda não enviadas) */}
          <PendentesGaleria titulo="Antes (a enviar)" fotos={pendAntes} aoRemover={removerPendente} />
          <PendentesGaleria titulo="Depois (a enviar)" fotos={pendDepois} aoRemover={removerPendente} />

          {/* Já salvas (modo edição) */}
          <GaleriaFotos
            titulo="Antes"
            fotos={(fotos ?? []).filter((f) => f.momento === 'antes')}
            aoExcluir={(f) => {
              if (confirm('Excluir esta foto?')) excluirFoto.mutate(f)
            }}
          />
          <GaleriaFotos
            titulo="Depois"
            fotos={(fotos ?? []).filter((f) => f.momento === 'depois')}
            aoExcluir={(f) => {
              if (confirm('Excluir esta foto?')) excluirFoto.mutate(f)
            }}
          />
        </div>

        {/* Mapa do pé — achados por região. */}
        <div>
          <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">Mapa do pé</p>
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
              {(['D', 'E'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeNovo(p)}
                  className={
                    'min-h-[40px] rounded-md font-bold ' +
                    (peNovo === p
                      ? 'bg-white dark:bg-slate-800 text-brand-700 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400')
                  }
                >
                  Pé {p === 'D' ? 'Direito' : 'Esquerdo'}
                </button>
              ))}
            </div>
            <input
              list="regioes-lista"
              value={regiaoNova}
              onChange={(e) => setRegiaoNova(e.target.value)}
              placeholder="Região (ex.: Hálux, Calcanhar)"
              className={inputClass}
            />
            <datalist id="regioes-lista">
              {REGIOES.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <input
              list="achados-lista"
              value={achadoNovo}
              onChange={(e) => setAchadoNovo(e.target.value)}
              placeholder="Achado (ex.: Calo, Micose)"
              className={inputClass}
            />
            <datalist id="achados-lista">
              {ACHADOS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <input
              value={obsMapa}
              onChange={(e) => setObsMapa(e.target.value)}
              placeholder="Observação (opcional)"
              className={inputClass}
            />
            <button
              type="button"
              onClick={adicionarAchado}
              className="min-h-[44px] rounded-lg border-2 border-dashed border-brand-400 px-4 font-bold text-brand-700"
            >
              + Adicionar achado
            </button>
          </div>

          {(['D', 'E'] as const).map((p) => (
            <MapaGrupo
              key={p}
              titulo={p === 'D' ? 'Pé direito' : 'Pé esquerdo'}
              salvos={(mapa ?? []).filter((m) => m.pe === p)}
              pendentes={mapaPendentes.filter((m) => m.pe === p)}
              aoExcluir={(m) => {
                if (confirm('Excluir este achado?')) excluirMapa.mutate(m.id)
              }}
              aoRemover={removerMapaPendente}
            />
          ))}
        </div>

        {/* Materiais usados — baixam do estoque ao salvar. */}
        <div>
          <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">Materiais usados</p>
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            {(estoque ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhum material no estoque ainda. Cadastre em Mais → Estoque pra
                escolher aqui.
              </p>
            ) : (
              <>
                <select
                  value={matSelId}
                  onChange={(e) => setMatSelId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Escolha um material…</option>
                  {(estoque ?? []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.tipo === 'lote'
                        ? `${e.nome} (por lote)`
                        : `${e.nome} (${formatQtd(e.quantidade)} ${e.unidade})`}
                    </option>
                  ))}
                </select>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Campo rotulo={matEhLote ? 'Usos neste atendimento' : 'Quantidade'}>
                      <input
                        inputMode="decimal"
                        value={matQtd}
                        onChange={(e) => setMatQtd(e.target.value)}
                        className={inputClass}
                      />
                    </Campo>
                  </div>
                  <span className="min-h-[48px] shrink-0 self-end pb-3 text-slate-500 dark:text-slate-400">
                    {matEhLote ? 'uso(s)' : matSelecionado?.unidade ?? ''}
                  </span>
                </div>
                {matEhLote && (
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={matFecharLote}
                      onChange={(e) => setMatFecharLote(e.target.checked)}
                      className="h-5 w-5 accent-brand-600"
                    />
                    🔴 Esse frasco acabou agora
                  </label>
                )}
                <button
                  type="button"
                  onClick={adicionarMaterial}
                  disabled={!matSelId}
                  className="min-h-[44px] rounded-lg border-2 border-dashed border-brand-400 px-4 font-bold text-brand-700 disabled:opacity-40"
                >
                  + Adicionar material
                </button>
              </>
            )}
          </div>

          <MateriaisLista
            pendentes={materiaisPendentes}
            salvos={materiais ?? []}
            aoRemoverPendente={removerMaterialPendente}
            aoExcluirSalvo={(m) => {
              if (confirm(`Remover "${m.nome}" e devolver ao estoque?`))
                excluirMaterial.mutate(m)
            }}
          />
        </div>

        {/* Produtos vendidos — baixam estoque e entram no financeiro ao salvar. */}
        {produtosVenda.length > 0 && (
          <div>
            <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">Produtos vendidos</p>
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
              <select
                value={prodSelId}
                onChange={(e) => setProdSelId(e.target.value)}
                className={inputClass}
              >
                <option value="">Escolha um produto…</option>
                {produtosVenda.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome} — {formatReal(e.preco)} ({formatQtd(e.quantidade)} em estoque)
                  </option>
                ))}
              </select>
              <div className="flex items-end gap-3">
                <div className="w-28">
                  <Campo rotulo="Qtd">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={prodQtd}
                      onChange={(e) => setProdQtd(e.target.value)}
                      className={inputClass}
                    />
                  </Campo>
                </div>
                <button
                  type="button"
                  onClick={adicionarProduto}
                  disabled={!prodSelId}
                  className="min-h-[48px] flex-1 rounded-lg border-2 border-dashed border-green-500 px-4 font-bold text-green-700 disabled:opacity-40"
                >
                  + Adicionar
                </button>
              </div>

              {produtosVendidos.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                    <select
                      value={prodForma}
                      onChange={(e) => setProdForma(e.target.value as FormaPagamento)}
                      className={inputClass}
                    >
                      {FORMAS.map((f) => (
                        <option key={f.valor} value={f.valor}>
                          {f.rotulo}
                        </option>
                      ))}
                    </select>
                    <select
                      value={prodStatus}
                      onChange={(e) => setProdStatus(e.target.value as StatusPagamento)}
                      className={inputClass}
                    >
                      <option value="pago">Recebido</option>
                      <option value="pendente">Fiado</option>
                    </select>
                  </div>
                  <p className="text-right font-bold text-green-700">
                    Total: {formatReal(totalProdutos)}
                  </p>
                </>
              )}
            </div>

            {produtosVendidos.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {produtosVendidos.map((p) => (
                  <li
                    key={p.localId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2"
                  >
                    <span className="min-w-0 text-sm">
                      <b className="text-slate-800 dark:text-slate-100">{p.nome}</b> —{' '}
                      {p.quantidade}× {formatReal(p.preco)} = {formatReal(p.preco * p.quantidade)}{' '}
                      <span className="text-xs text-amber-600">a salvar</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removerProduto(p.localId)}
                      aria-label="Remover produto"
                      className="shrink-0 text-red-600"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Pagamento — registrado junto ao salvar o atendimento. */}
        {!editando && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
              <input
                type="checkbox"
                checked={registrarPag}
                onChange={(e) => setRegistrarPag(e.target.checked)}
                className="h-5 w-5 accent-brand-600"
              />
              Registrar pagamento
            </label>

            {registrarPag && (
              <div className="mt-3 flex flex-col gap-3">
                <Campo rotulo="Valor (R$)">
                  <input
                    inputMode="decimal"
                    value={valorPag}
                    onChange={(e) => setValorPag(e.target.value)}
                    placeholder="0,00"
                    className={inputClass}
                  />
                </Campo>
                <Campo rotulo="Forma">
                  <select
                    value={formaPag}
                    onChange={(e) => setFormaPag(e.target.value as FormaPagamento)}
                    className={inputClass}
                  >
                    {FORMAS.map((f) => (
                      <option key={f.valor} value={f.valor}>
                        {f.rotulo}
                      </option>
                    ))}
                  </select>
                </Campo>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                  {(
                    [
                      ['pago', 'Recebido'],
                      ['pendente', 'Fiado (a receber)'],
                    ] as [StatusPagamento, string][]
                  ).map(([s, r]) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusPag(s)}
                      className={
                        'min-h-[40px] rounded-md font-bold ' +
                        (statusPag === s ? 'bg-white dark:bg-slate-800 text-brand-700 shadow-sm' : 'text-slate-500 dark:text-slate-400')
                      }
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {statusPag === 'pendente' && (
                  <Campo rotulo="Data pra receber">
                    <DateInputBR
                      value={vencimentoPag}
                      onChange={setVencimentoPag}
                      className={inputClass}
                    />
                  </Campo>
                )}
              </div>
            )}
          </div>
        )}

        {/* Marcar retorno — cria a próxima consulta ao salvar. */}
        {!editando && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
              <input
                type="checkbox"
                checked={agendarRetorno}
                onChange={(e) => setAgendarRetorno(e.target.checked)}
                className="h-5 w-5 accent-brand-600"
              />
              Marcar retorno
            </label>

            {agendarRetorno && (
              <div className="mt-3 flex gap-3">
                <div className="flex-1">
                  <Campo rotulo="Data do retorno">
                    <DateInputBR
                      value={dataRetorno}
                      onChange={setDataRetorno}
                      className={inputClass}
                    />
                  </Campo>
                </div>
                <div className="w-28">
                  <Campo rotulo="Hora">
                    <input
                      type="time"
                      value={horaRetorno}
                      onChange={(e) => setHoraRetorno(e.target.value)}
                      className={inputClass}
                    />
                  </Campo>
                </div>
              </div>
            )}
          </div>
        )}

        {erro && (
          <p role="alert" className="font-bold text-red-700">
            {erro}
          </p>
        )}

        <BotaoPrimario type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </BotaoPrimario>

        {editando && (
          <button
            type="button"
            onClick={aoExcluir}
            className="min-h-[44px] rounded-lg border border-red-300 px-4 font-bold text-red-700"
          >
            Excluir atendimento
          </button>
        )}
      </form>
    </section>
  )
}

function PendentesGaleria({
  titulo,
  fotos,
  aoRemover,
}: {
  titulo: string
  fotos: FotoPendente[]
  aoRemover: (localId: string) => void
}) {
  if (fotos.length === 0) return null
  return (
    <div className="mt-3">
      <h3 className="mb-2 text-sm font-bold text-amber-600">{titulo}</h3>
      <div className="grid grid-cols-3 gap-2">
        {fotos.map((f) => (
          <div key={f.localId} className="relative">
            <img
              src={f.preview}
              alt={titulo}
              className="aspect-square w-full rounded-lg object-cover ring-2 ring-amber-300"
            />
            <button
              type="button"
              onClick={() => aoRemover(f.localId)}
              aria-label="Remover foto"
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function MapaGrupo({
  titulo,
  salvos,
  pendentes,
  aoExcluir,
  aoRemover,
}: {
  titulo: string
  salvos: MapaPodologico[]
  pendentes: MapaPendente[]
  aoExcluir: (m: MapaPodologico) => void
  aoRemover: (localId: string) => void
}) {
  if (salvos.length === 0 && pendentes.length === 0) return null
  return (
    <div className="mt-3">
      <h3 className="mb-2 text-sm font-bold text-slate-500 dark:text-slate-400">{titulo}</h3>
      <ul className="flex flex-col gap-2">
        {salvos.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
          >
            <span className="min-w-0 text-sm">
              <b className="text-slate-800 dark:text-slate-100">{m.regiao}</b> — {m.achado}
              {m.observacao ? ` (${m.observacao})` : ''}
            </span>
            <button
              type="button"
              onClick={() => aoExcluir(m)}
              aria-label="Excluir achado"
              className="shrink-0 text-red-600"
            >
              ×
            </button>
          </li>
        ))}
        {pendentes.map((m) => (
          <li
            key={m.localId}
            className="flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2"
          >
            <span className="min-w-0 text-sm">
              <b className="text-slate-800 dark:text-slate-100">{m.regiao}</b> — {m.achado}
              {m.observacao ? ` (${m.observacao})` : ''}{' '}
              <span className="text-xs text-amber-600">a salvar</span>
            </span>
            <button
              type="button"
              onClick={() => aoRemover(m.localId)}
              aria-label="Remover achado"
              className="shrink-0 text-red-600"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MateriaisLista({
  pendentes,
  salvos,
  aoRemoverPendente,
  aoExcluirSalvo,
}: {
  pendentes: MaterialPendente[]
  salvos: MaterialUsado[]
  aoRemoverPendente: (localId: string) => void
  aoExcluirSalvo: (m: MaterialUsado) => void
}) {
  if (pendentes.length === 0 && salvos.length === 0) return null
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {salvos.map((m) => (
        <li
          key={m.id}
          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
        >
          <span className="min-w-0 text-sm">
            <b className="text-slate-800 dark:text-slate-100">{m.nome}</b> —{' '}
            {formatQtd(m.quantidade)} {m.unidade}
          </span>
          <button
            type="button"
            onClick={() => aoExcluirSalvo(m)}
            aria-label="Remover material"
            className="shrink-0 text-red-600"
          >
            ×
          </button>
        </li>
      ))}
      {pendentes.map((m) => (
        <li
          key={m.localId}
          className="flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2"
        >
          <span className="min-w-0 text-sm">
            <b className="text-slate-800 dark:text-slate-100">{m.nome}</b> —{' '}
            {formatQtd(m.quantidade)} {m.unidade}
            {m.fecharLote ? ' · frasco acabou' : ''}{' '}
            <span className="text-xs text-amber-600">a salvar</span>
          </span>
          <button
            type="button"
            onClick={() => aoRemoverPendente(m.localId)}
            aria-label="Remover material"
            className="shrink-0 text-red-600"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

function GaleriaFotos({
  titulo,
  fotos,
  aoExcluir,
}: {
  titulo: string
  fotos: FotoComUrl[]
  aoExcluir: (f: FotoComUrl) => void
}) {
  if (fotos.length === 0) return null
  return (
    <div className="mt-3">
      <h3 className="mb-2 text-sm font-bold text-slate-500 dark:text-slate-400">{titulo}</h3>
      <div className="grid grid-cols-3 gap-2">
        {fotos.map((f) => (
          <div key={f.id} className="relative">
            {f.url ? (
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={f.url}
                  alt={titulo}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </a>
            ) : (
              <div className="aspect-square w-full rounded-lg bg-slate-100 dark:bg-slate-700" />
            )}
            <button
              type="button"
              onClick={() => aoExcluir(f)}
              aria-label="Excluir foto"
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
