import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useAtualizarPaciente,
  useCriarPaciente,
  usePaciente,
} from '../features/pacientes/api'
import type { PacienteInput } from '../lib/types'
import { BotaoPrimario, Campo, inputClass, PageHeader } from '../components/ui'
import { DateInputBR } from '../components/DateInputBR'

const vazio: PacienteInput = {
  nome: '',
  telefone: '',
  nascimento: '',
  documento: '',
  email: '',
  endereco: '',
  observacoes: '',
}

export function PacienteFormPage() {
  const { id } = useParams()
  const editando = !!id
  const navigate = useNavigate()

  const { data: paciente } = usePaciente(id)
  const criar = useCriarPaciente()
  const atualizar = useAtualizarPaciente()

  const [form, setForm] = useState<PacienteInput>(vazio)
  const [erro, setErro] = useState<string | null>(null)

  // Ao carregar um paciente para edição, preenche o formulário.
  useEffect(() => {
    if (paciente) {
      setForm({
        nome: paciente.nome,
        telefone: paciente.telefone ?? '',
        nascimento: paciente.nascimento ?? '',
        documento: paciente.documento ?? '',
        email: paciente.email ?? '',
        endereco: paciente.endereco ?? '',
        observacoes: paciente.observacoes ?? '',
      })
    }
  }, [paciente])

  function set<K extends keyof PacienteInput>(campo: K, valor: PacienteInput[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    // Normaliza campos vazios para null.
    const limpo: PacienteInput = {
      ...form,
      telefone: form.telefone || null,
      nascimento: form.nascimento || null,
      documento: form.documento || null,
      email: form.email || null,
      endereco: form.endereco || null,
      observacoes: form.observacoes || null,
    }
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: id!, input: limpo })
        navigate(`/pacientes/${id}`, { replace: true })
      } else {
        const novo = await criar.mutateAsync(limpo)
        navigate(`/pacientes/${novo.id}`, { replace: true })
      }
    } catch {
      setErro('Não foi possível salvar. Verifique sua conexão e tente de novo.')
    }
  }

  const salvando = criar.isPending || atualizar.isPending

  return (
    <section>
      <PageHeader titulo={editando ? 'Editar paciente' : 'Novo paciente'} voltar />

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Campo rotulo="Nome *">
          <input
            required
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Telefone / WhatsApp">
          <input
            type="tel"
            inputMode="tel"
            placeholder="(62) 99999-9999"
            value={form.telefone ?? ''}
            onChange={(e) => set('telefone', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Data de nascimento">
          <DateInputBR
            value={form.nascimento ?? ''}
            onChange={(iso) => set('nascimento', iso)}
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="CPF / documento">
          <input
            value={form.documento ?? ''}
            onChange={(e) => set('documento', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="E-mail">
          <input
            type="email"
            autoCapitalize="none"
            autoCorrect="off"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Endereço">
          <input
            value={form.endereco ?? ''}
            onChange={(e) => set('endereco', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Observações">
          <textarea
            rows={3}
            value={form.observacoes ?? ''}
            onChange={(e) => set('observacoes', e.target.value)}
            className={inputClass + ' py-2'}
          />
        </Campo>

        {erro && (
          <p role="alert" className="font-bold text-red-700">
            {erro}
          </p>
        )}

        <BotaoPrimario type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </BotaoPrimario>
      </form>
    </section>
  )
}
