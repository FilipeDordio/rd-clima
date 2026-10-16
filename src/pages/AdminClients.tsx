import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Chip } from '../components/Chip'
import { JobForm } from '../components/JobForm'
import { formatarProximaManutencao } from '../lib/manutencao'
import {
  TIPOS_OPERACAO,
  TIPO_OPERACAO_LABELS,
  TIPO_SERVICO_LABELS,
  type Aparelho,
  type Cliente,
  type Profile,
  type TipoOperacao,
} from '../types'

export function AdminClients() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadClientes()
  }, [])

  async function loadClientes() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('nome')
    setClientes((data as Cliente[]) ?? [])
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink">Clientes</h2>
          <button
            onClick={() => setCreating(true)}
            className="shrink-0 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white"
          >
            + Novo cliente
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted">A carregar...</p>
        ) : clientes.length === 0 ? (
          <p className="text-sm text-muted">Ainda não há clientes registados.</p>
        ) : (
          <ul className="divide-y divide-line">
            {clientes.map((cliente) => (
              <li
                key={cliente.id}
                onClick={() => setEditingCliente(cliente)}
                className="flex cursor-pointer items-center justify-between gap-3 py-3 hover:bg-paper"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{cliente.nome}</p>
                  <p className="text-xs text-muted">
                    {cliente.morada}
                    {cliente.localidade && ` · ${cliente.localidade}`}
                  </p>
                  {(cliente.telefone || cliente.email) && (
                    <p className="text-xs text-muted">
                      {[cliente.telefone, cliente.email].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                {cliente.tipo_operacao && (
                  <span className="whitespace-nowrap rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-medium text-gold-deep">
                    {TIPO_OPERACAO_LABELS[cliente.tipo_operacao]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <ClienteFormSheet
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false)
            loadClientes()
          }}
        />
      )}

      {editingCliente && (
        <ClienteFormSheet
          cliente={editingCliente}
          onClose={() => setEditingCliente(null)}
          onSaved={() => {
            setEditingCliente(null)
            loadClientes()
          }}
        />
      )}
    </div>
  )
}

const fieldClass =
  'w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold'
const labelClass = 'mb-1 block text-sm font-medium text-ink'

function ClienteFormSheet({
  cliente,
  onClose,
  onSaved,
}: {
  cliente?: Cliente
  onClose: () => void
  onSaved: () => void
}) {
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [morada, setMorada] = useState(cliente?.morada ?? '')
  const [localidade, setLocalidade] = useState(cliente?.localidade ?? '')
  const [dimensoes, setDimensoes] = useState(cliente?.dimensoes ?? '')
  const [tipoOperacao, setTipoOperacao] = useState<TipoOperacao | ''>(cliente?.tipo_operacao ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [aparelhos, setAparelhos] = useState<Aparelho[]>([])
  const [loadingAparelhos, setLoadingAparelhos] = useState(true)
  const [tecnicos, setTecnicos] = useState<Profile[]>([])
  const [agendarAparelho, setAgendarAparelho] = useState<Aparelho | null>(null)

  useEffect(() => {
    if (!cliente) return
    loadAparelhos()
    supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'tecnico'])
      .order('nome')
      .then(({ data: rows }) => setTecnicos((rows as Profile[]) ?? []))
  }, [])

  async function loadAparelhos() {
    if (!cliente) return
    setLoadingAparelhos(true)
    const { data: rows } = await supabase
      .from('aparelhos')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('data_instalacao', { ascending: false })
    setAparelhos((rows as Aparelho[]) ?? [])
    setLoadingAparelhos(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      nome,
      telefone: telefone || null,
      email: email || null,
      morada,
      localidade: localidade || null,
      dimensoes: dimensoes || null,
      tipo_operacao: tipoOperacao || null,
    }

    const { error: saveError } = cliente
      ? await supabase.from('clientes').update(payload).eq('id', cliente.id)
      : await supabase.from('clientes').insert(payload)

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    onSaved()
  }

  async function handleDelete() {
    if (!cliente) return
    if (!confirm('Eliminar este cliente?')) return

    setSaving(true)
    const { error } = await supabase.from('clientes').delete().eq('id', cliente.id)
    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white sm:items-center sm:justify-center sm:bg-black/40 sm:p-4">
      <div className="flex h-full w-full flex-col sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:overflow-hidden sm:rounded-xl sm:shadow-lg">
        <div className="flex items-center gap-2 bg-ink px-4 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-paper/70 transition hover:text-paper"
          >
            Cancelar
          </button>
          <h2 className="flex-1 text-center text-sm font-bold text-paper">
            {cliente ? 'Editar cliente' : 'Novo cliente'}
          </h2>
          <span className="w-[52px]" />
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div>
              <label className={labelClass}>Nome</label>
              <input required value={nome} onChange={(e) => setNome(e.target.value)} className={fieldClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Telemóvel</label>
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="9XX XXX XXX"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Morada</label>
              <input
                required
                value={morada}
                onChange={(e) => setMorada(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Localidade</label>
                <input
                  value={localidade}
                  onChange={(e) => setLocalidade(e.target.value)}
                  placeholder="Ex: Arraiolos"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Modelo do aparelho</label>
                <input
                  value={dimensoes}
                  onChange={(e) => setDimensoes(e.target.value)}
                  placeholder="Ex: 12000 BTU, Daikin Altherma..."
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Tipo</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_OPERACAO.map((tipo) => (
                  <Chip
                    key={tipo}
                    selected={tipoOperacao === tipo}
                    onClick={() => setTipoOperacao(tipo)}
                  >
                    {TIPO_OPERACAO_LABELS[tipo]}
                  </Chip>
                ))}
              </div>
            </div>

            {cliente && (
              <div className="border-t border-line pt-4">
                <label className={labelClass}>Aparelhos instalados</label>

                {loadingAparelhos ? (
                  <p className="text-sm text-muted">A carregar...</p>
                ) : aparelhos.length === 0 ? (
                  <p className="text-sm text-muted">Ainda não há aparelhos registados para este cliente.</p>
                ) : (
                  <ul className="space-y-2">
                    {aparelhos.map((aparelho) => (
                      <li key={aparelho.id} className="rounded-lg border border-line p-3">
                        <p className="text-sm font-medium text-ink">
                          {TIPO_SERVICO_LABELS[aparelho.tipo_servico]}
                          {aparelho.tipo_ac && ` · ${aparelho.tipo_ac}`}
                        </p>
                        <p className="text-xs text-muted">{aparelho.morada}</p>
                        {(aparelho.data_ultima_manutencao || aparelho.data_instalacao) && (
                          <p className="mt-1 text-xs text-muted">
                            {aparelho.data_ultima_manutencao
                              ? `Última manutenção: ${format(new Date(`${aparelho.data_ultima_manutencao}T00:00:00`), 'dd/MM/yyyy')}`
                              : `Instalado em ${format(new Date(`${aparelho.data_instalacao}T00:00:00`), 'dd/MM/yyyy')}`}
                          </p>
                        )}
                        {aparelho.proxima_manutencao && (
                          <p className="mt-1 inline-block rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-medium text-gold-deep">
                            Próxima manutenção: {formatarProximaManutencao(aparelho.proxima_manutencao, aparelho.proxima_manutencao_dia_certo)}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => setAgendarAparelho(aparelho)}
                          className="mt-2 block w-full rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper"
                        >
                          Agendar manutenção
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line bg-white px-4 py-3">
            {cliente ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger-soft disabled:opacity-60"
              >
                Eliminar
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white disabled:opacity-60 sm:flex-none"
            >
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {agendarAparelho && cliente && (
        <JobForm
          initial={{
            cliente_id: cliente.id,
            cliente: cliente.nome,
            endereco: agendarAparelho.morada,
            tipo_servico: 'manutencao',
            aparelho_id: agendarAparelho.id,
          }}
          tecnicos={tecnicos}
          clientes={[cliente]}
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
