import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePaciente, useExcluirPaciente } from '../features/pacientes/api'
import {
  calcularIdade,
  formatData,
  formatTelefone,
  linkWhatsapp,
} from '../lib/format'
import { Aviso, PageHeader } from '../components/ui'

export function PacienteDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: p, isLoading, isError } = usePaciente(id)
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

      {/* Próximos itens do prontuário (chegam ainda na Fase 1). */}
      <h2 className="mb-2 mt-6 text-lg font-bold text-slate-800">Prontuário</h2>
      <Aviso>Anamnese, atendimentos e fotos chegam nas próximas etapas.</Aviso>

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
