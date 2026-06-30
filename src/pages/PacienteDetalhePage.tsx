import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePaciente, useExcluirPaciente } from '../features/pacientes/api'
import { useAnamnese, useAtendimentosDoPaciente } from '../features/prontuario/api'
import {
  calcularIdade,
  formatData,
  formatTelefone,
  horaLocal,
  linkWhatsapp,
} from '../lib/format'
import type { Atendimento } from '../lib/types'
import { Aviso, PageHeader } from '../components/ui'

export function PacienteDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: p, isLoading, isError } = usePaciente(id)
  const { data: anamnese } = useAnamnese(id)
  const { data: atendimentos } = useAtendimentosDoPaciente(id)
  const excluir = useExcluirPaciente()

  if (isLoading) {
    return (
      <section>
        <PageHeader titulo="Paciente" voltar />
        <Aviso>Carregando…</Aviso>
      </section>
    )
  }
  if (isError || !p) {
    return (
      <section>
        <PageHeader titulo="Paciente" voltar />
        <Aviso>Paciente não encontrado.</Aviso>
      </section>
    )
  }

  const idade = calcularIdade(p.nascimento)
  const wa = linkWhatsapp(p.telefone)

  async function aoExcluir() {
    if (!confirm(`Excluir o paciente ${p!.nome}? Esta ação não pode ser desfeita.`)) return
    await excluir.mutateAsync(p!.id)
    navigate('/pacientes', { replace: true })
  }

  return (
    <section>
      <PageHeader
        titulo={p.nome}
        voltar
        acao={
          <Link
            to={`/pacientes/${p.id}/editar`}
            className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700"
          >
            Editar
          </Link>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <Linha rotulo="Telefone" valor={formatTelefone(p.telefone)} />
        <Linha
          rotulo="Nascimento"
          valor={
            p.nascimento
              ? `${formatData(p.nascimento)}${idade != null ? ` (${idade} anos)` : ''}`
              : ''
          }
        />
        <Linha rotulo="CPF / documento" valor={p.documento} />
        <Linha rotulo="E-mail" valor={p.email} />
        <Linha rotulo="Endereço" valor={p.endereco} />
        <Linha rotulo="Observações" valor={p.observacoes} />
      </div>

      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex min-h-[48px] items-center justify-center rounded-lg bg-green-600 px-4 font-bold text-white"
        >
          Falar no WhatsApp
        </a>
      )}

      {/* Prontuário */}
      <h2 className="mb-2 mt-6 text-lg font-bold text-slate-800">Prontuário</h2>

      {/* Anamnese */}
      <Link
        to={`/pacientes/${p.id}/anamnese`}
        className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
      >
        <span>
          <span className="block font-bold text-slate-800">Anamnese</span>
          <span className="block text-sm text-slate-500">
            {anamnese
              ? `Atualizada em ${formatData(anamnese.atualizado_em)}`
              : 'Ainda não preenchida'}
          </span>
        </span>
        <span className="font-bold text-brand-700">{anamnese ? 'Ver' : 'Preencher'}</span>
      </Link>

      {/* Atendimentos */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Atendimentos</h3>
        <Link
          to={`/pacientes/${p.id}/atendimentos/novo`}
          className="text-sm font-bold text-brand-700"
        >
          + Novo
        </Link>
      </div>

      {!atendimentos || atendimentos.length === 0 ? (
        <Aviso>Nenhum atendimento registrado.</Aviso>
      ) : (
        <ul className="flex flex-col gap-2">
          {atendimentos.map((at) => (
            <li key={at.id}>
              <AtendimentoLinha pacienteId={p.id} at={at} />
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={aoExcluir}
        disabled={excluir.isPending}
        className="mt-8 min-h-[44px] w-full rounded-lg border border-red-300 px-4 font-bold text-red-700"
      >
        Excluir paciente
      </button>
    </section>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  if (!valor) return null
  return (
    <div>
      <p className="text-sm text-slate-500">{rotulo}</p>
      <p className="font-bold text-slate-800">{valor}</p>
    </div>
  )
}

function AtendimentoLinha({ pacienteId, at }: { pacienteId: string; at: Atendimento }) {
  return (
    <Link
      to={`/pacientes/${pacienteId}/atendimentos/${at.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-3"
    >
      <p className="font-bold text-slate-900">
        {formatData(at.data)} · {horaLocal(at.data)}
      </p>
      <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
        {at.evolucao || 'Sem descrição.'}
      </p>
    </Link>
  )
}
