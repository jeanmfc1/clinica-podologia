import { useMemo, useState } from 'react'
import { useAgendamentosIntervalo } from '../features/agenda/api'
import { rotuloForma, usePagamentosIntervalo, usePendentes } from '../features/financeiro/api'
import { usePacientesInativos } from '../features/relatorios/api'
import type { FormaPagamento } from '../lib/types'
import {
  dataLocalISO,
  formatData,
  formatReal,
  hojeISO,
  linkWhatsapp,
} from '../lib/format'
import { clinica } from '../config'
import { Aviso, PageHeader } from '../components/ui'

const DIAS_INATIVO = 60

export function RelatoriosPage() {
  const [refDate, setRefDate] = useState(hojeISO())

  const range = useMemo(() => {
    const b = new Date(`${refDate}T00:00:00`)
    const ini = new Date(b.getFullYear(), b.getMonth(), 1)
    const fim = new Date(b.getFullYear(), b.getMonth() + 1, 1)
    return { iniISO: ini.toISOString(), fimISO: fim.toISOString() }
  }, [refDate])

  const { data: ags } = useAgendamentosIntervalo(range.iniISO, range.fimISO)
  const { data: pags } = usePagamentosIntervalo(range.iniISO, range.fimISO)
  const { data: pendentes } = usePendentes()
  const { data: inativos } = usePacientesInativos(DIAS_INATIVO)

  // Atendimentos e faltas no mês.
  const atendidos = (ags ?? []).filter((a) => a.status === 'atendido')
  const faltas = (ags ?? []).filter((a) => a.status === 'faltou')

  // Financeiro do mês (só pago).
  const { entrou, saiu } = useMemo(() => {
    let entrou = 0
    let saiu = 0
    for (const p of pags ?? []) {
      if (p.status !== 'pago') continue
      if (p.tipo === 'entrada') entrou += Number(p.valor)
      else saiu += Number(p.valor)
    }
    return { entrou, saiu }
  }, [pags])
  const saldo = entrou - saiu
  const aReceber = (pendentes ?? [])
    .filter((p) => p.tipo === 'entrada')
    .reduce((s, p) => s + Number(p.valor), 0)

  // Procedimentos mais feitos (dos atendidos no mês).
  const procedimentos = useMemo(() => {
    const mapa = new Map<string, { nome: string; qtd: number; total: number }>()
    for (const a of atendidos) {
      const nome = a.procedimento?.nome ?? 'Sem procedimento'
      const preco = Number(a.procedimento?.preco ?? 0)
      const atual = mapa.get(nome) ?? { nome, qtd: 0, total: 0 }
      atual.qtd += 1
      atual.total += preco
      mapa.set(nome, atual)
    }
    return [...mapa.values()].sort((a, b) => b.qtd - a.qtd)
  }, [atendidos])

  // Formas de pagamento (entradas pagas no mês).
  const formas = useMemo(() => {
    const mapa = new Map<FormaPagamento, number>()
    for (const p of pags ?? []) {
      if (p.tipo !== 'entrada' || p.status !== 'pago') continue
      mapa.set(p.forma, (mapa.get(p.forma) ?? 0) + Number(p.valor))
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1])
  }, [pags])

  const tituloMes = new Date(`${refDate}T00:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  function mudarMes(dir: number) {
    const b = new Date(`${refDate}T00:00:00`)
    setRefDate(dataLocalISO(new Date(b.getFullYear(), b.getMonth() + dir, 1).toISOString()))
  }

  return (
    <section>
      <PageHeader titulo="Relatórios" voltar />

      {/* Navegação de mês */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2">
        <button
          onClick={() => mudarMes(-1)}
          className="h-10 w-10 rounded-lg text-slate-600 dark:text-slate-300"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <span className="font-bold capitalize text-slate-800 dark:text-slate-100">{tituloMes}</span>
        <button
          onClick={() => mudarMes(1)}
          className="h-10 w-10 rounded-lg text-slate-600 dark:text-slate-300"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      {/* Resumo financeiro */}
      <div className="mb-2 grid grid-cols-2 gap-2">
        <Card titulo="Entrou" valor={formatReal(entrou)} cor="text-green-700" />
        <Card titulo="Saiu" valor={formatReal(saiu)} cor="text-red-700" />
        <Card titulo="Saldo" valor={formatReal(saldo)} cor={saldo >= 0 ? 'text-green-700' : 'text-red-700'} />
        <Card titulo="A receber (total)" valor={formatReal(aReceber)} cor="text-amber-700" />
      </div>

      {/* Atendimentos */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <Card titulo="Atendimentos no mês" valor={String(atendidos.length)} />
        <Card titulo="Faltas" valor={String(faltas.length)} />
      </div>

      {/* Procedimentos mais feitos */}
      <Secao titulo="Procedimentos mais feitos">
        {procedimentos.length === 0 ? (
          <Aviso>Nenhum atendimento neste mês.</Aviso>
        ) : (
          <ul className="flex flex-col gap-2">
            {procedimentos.map((p) => (
              <li
                key={p.nome}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900 dark:text-slate-50">{p.nome}</span>
                  <span className="block text-sm text-slate-500 dark:text-slate-400">
                    {p.qtd}× · {formatReal(p.total)}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
                  {p.qtd}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {/* Formas de pagamento */}
      <Secao titulo="Formas de pagamento">
        {formas.length === 0 ? (
          <Aviso>Nenhum recebimento neste mês.</Aviso>
        ) : (
          <ul className="flex flex-col gap-2">
            {formas.map(([forma, total]) => (
              <li
                key={forma}
                className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
              >
                <span className="font-bold text-slate-800 dark:text-slate-100">{rotuloForma(forma)}</span>
                <span className="font-bold text-green-700">{formatReal(total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {/* Pacientes que sumiram */}
      <Secao titulo={`Sem voltar há +${DIAS_INATIVO} dias`}>
        {!inativos || inativos.length === 0 ? (
          <Aviso>Ninguém sumido por enquanto. 🎉</Aviso>
        ) : (
          <ul className="flex flex-col gap-2">
            {inativos.map((p) => {
              const msg = `Olá, ${p.nome.split(' ')[0]}! 😊 Sentimos sua falta na ${clinica.nome}. Que tal cuidar dos seus pés? É só me chamar pra marcar. 💙`
              const zap = linkWhatsapp(p.telefone, msg)
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-slate-900 dark:text-slate-50">{p.nome}</span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                      última visita: {formatData(p.ultimaVisita)}
                    </span>
                  </span>
                  {zap && (
                    <a
                      href={zap}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Chamar ${p.nome} no WhatsApp`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-xl text-white"
                    >
                      💬
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Secao>
    </section>
  )
}

function Card({
  titulo,
  valor,
  cor = 'text-slate-900 dark:text-slate-50',
}: {
  titulo: string
  valor: string
  cor?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">{titulo}</p>
      <p className={'text-base font-bold ' + cor}>{valor}</p>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 font-bold text-slate-800 dark:text-slate-100">{titulo}</h2>
      {children}
    </div>
  )
}
