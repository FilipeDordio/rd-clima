import { useEffect, useState } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import { formatarProximaManutencao } from '../lib/manutencao'
import { NotifyClienteButtons } from './NotifyClienteButtons'
import { JobForm } from './JobForm'
import { TIPO_SERVICO_LABELS, type AparelhoComCliente, type Cliente, type Profile } from '../types'

const JANELA_DIAS = 60

interface ProximasManutencoesProps {
  tecnicos: Profile[]
  clientes: Cliente[]
  variant?: 'widget' | 'page'
}

export function ProximasManutencoes({
  tecnicos,
  clientes,
  variant = 'widget',
}: ProximasManutencoesProps) {
  const [aparelhos, setAparelhos] = useState<AparelhoComCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [agendarAparelho, setAgendarAparelho] = useState<AparelhoComCliente | null>(null)

  useEffect(() => {
    loadAparelhos()
  }, [])

  async function loadAparelhos() {
    setLoading(true)
    const { data } = await supabase
      .from('aparelhos')
      .select('*, cliente_contacto:clientes(telefone, email)')
      .not('proxima_manutencao', 'is', null)
      .order('proxima_manutencao', { ascending: true })
    setAparelhos((data as AparelhoComCliente[]) ?? [])
    setLoading(false)
  }

  const hoje = new Date()
  const relevantes = aparelhos.filter(
    (a) =>
      a.proxima_manutencao &&
      differenceInCalendarDays(new Date(`${a.proxima_manutencao}T00:00:00`), hoje) <= JANELA_DIAS,
  )

  if (variant === 'widget' && (loading || relevantes.length === 0)) return null

  return (
    <div
      className={
        variant === 'widget'
          ? 'mb-4 rounded-xl border border-line bg-white p-4 shadow-sm'
          : 'rounded-xl border border-line bg-white p-4 shadow-sm'
      }
    >
      <h2 className="mb-3 text-base font-bold text-ink">Próximas manutenções</h2>

      {loading ? (
        <p className="text-sm text-muted">A carregar...</p>
      ) : relevantes.length === 0 ? (
        <p className="text-sm text-muted">Sem manutenções previstas para os próximos 60 dias.</p>
      ) : (
      <div className="space-y-3">
        {relevantes.map((aparelho) => {
          const proximaManutencao = aparelho.proxima_manutencao as string
          const dias = differenceInCalendarDays(new Date(`${proximaManutencao}T00:00:00`), hoje)
          const atrasada = dias < 0

          return (
            <div key={aparelho.id} className="rounded-lg border border-line p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{aparelho.cliente_nome}</p>
                  <p className="text-xs text-muted">
                    {TIPO_SERVICO_LABELS[aparelho.tipo_servico]} · {aparelho.morada}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    atrasada ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-gold-deep'
                  }`}
                >
                  {atrasada
                    ? 'Atrasada'
                    : formatarProximaManutencao(proximaManutencao, aparelho.proxima_manutencao_dia_certo)}
                </span>
              </div>

              <div className="mt-2">
                <NotifyClienteButtons
                  telefone={aparelho.cliente_contacto?.telefone}
                  email={aparelho.cliente_contacto?.email}
                  assunto="RD Clima — manutenção"
                  mensagem={`Olá! Está a aproximar-se a altura da manutenção do seu ${TIPO_SERVICO_LABELS[aparelho.tipo_servico]} em ${aparelho.morada}. Quer agendar?`}
                />
              </div>

              <button
                type="button"
                onClick={() => setAgendarAparelho(aparelho)}
                className="mt-2 w-full rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-ink transition hover:bg-gold-deep hover:text-white"
              >
                Agendar manutenção
              </button>
            </div>
          )
        })}
      </div>
      )}

      {agendarAparelho && (
        <JobForm
          initial={{
            cliente_id: agendarAparelho.cliente_id,
            cliente: agendarAparelho.cliente_nome,
            endereco: agendarAparelho.morada,
            tipo_servico: 'manutencao',
            aparelho_id: agendarAparelho.id,
          }}
          tecnicos={tecnicos}
          clientes={clientes}
          onClose={() => setAgendarAparelho(null)}
          onSaved={() => {
            setAgendarAparelho(null)
            loadAparelhos()
          }}
        />
      )}
    </div>
  )
}
