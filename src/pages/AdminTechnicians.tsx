import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { createSignupClient } from '../lib/supabaseSignup'
import type { Ausencia, Profile } from '../types'

interface TecnicoStats {
  total: number
  instalados: number
}

export function AdminTechnicians() {
  const [tecnicos, setTecnicos] = useState<Profile[]>([])
  const [stats, setStats] = useState<Record<string, TecnicoStats>>({})
  const [loading, setLoading] = useState(true)
  const [editingTecnico, setEditingTecnico] = useState<Profile | null>(null)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadTecnicos()
  }, [])

  async function loadTecnicos() {
    setLoading(true)
    const [{ data: tecnicosData }, { data: assignmentsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'tecnico').order('nome'),
      supabase.from('job_tecnicos').select('tecnico_id, job:jobs(estado)'),
    ])

    setTecnicos((tecnicosData as Profile[]) ?? [])

    const statsByTecnico: Record<string, TecnicoStats> = {}
    for (const assignment of assignmentsData ?? []) {
      const entry = statsByTecnico[assignment.tecnico_id] ?? { total: 0, instalados: 0 }
      entry.total += 1
      if ((assignment.job as unknown as { estado: string } | null)?.estado === 'instalado') {
        entry.instalados += 1
      }
      statsByTecnico[assignment.tecnico_id] = entry
    }
    setStats(statsByTecnico)

    setLoading(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const signupClient = createSignupClient()
    const { error: signupError } = await signupClient.auth.signUp({
      email,
      password,
      options: { data: { nome, role: 'tecnico', telefone } },
    })
    await signupClient.auth.signOut()

    setSaving(false)

    if (signupError) {
      setError(signupError.message)
      return
    }

    setSuccess(`Técnico "${nome}" criado. Já pode iniciar sessão com este email e palavra-passe.`)
    setNome('')
    setEmail('')
    setTelefone('')
    setPassword('')
    loadTecnicos()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-ink">Novo técnico</h2>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Nome</label>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Telemóvel</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="9XX XXX XXX"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Palavra-passe</label>
            <input
              required
              type="text"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="mín. 6 caracteres"
            />
          </div>

          {error && <p className="text-sm text-danger sm:col-span-2 lg:col-span-4">{error}</p>}
          {success && (
            <p className="text-sm text-success sm:col-span-2 lg:col-span-4">{success}</p>
          )}

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white disabled:opacity-60"
            >
              {saving ? 'A criar...' : 'Criar técnico'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-ink">Técnicos</h2>

        {loading ? (
          <p className="text-sm text-muted">A carregar...</p>
        ) : tecnicos.length === 0 ? (
          <p className="text-sm text-muted">Ainda não há técnicos registados.</p>
        ) : (
          <ul className="divide-y divide-line">
            {tecnicos.map((tecnico) => {
              const tecnicoStats = stats[tecnico.id] ?? { total: 0, instalados: 0 }
              return (
                <li
                  key={tecnico.id}
                  onClick={() => setEditingTecnico(tecnico)}
                  className="flex cursor-pointer items-center gap-3 py-3 hover:bg-paper"
                >
                  {tecnico.avatar_url ? (
                    <img
                      src={tecnico.avatar_url}
                      alt={tecnico.nome}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warn-soft text-sm font-semibold text-gold-deep">
                      {tecnico.nome.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{tecnico.nome}</p>
                    <p className="text-xs text-muted">
                      {tecnico.email}
                      {tecnico.telefone && ` · ${tecnico.telefone}`}
                    </p>
                  </div>

                  <div className="text-right text-xs text-muted">
                    <p>{tecnicoStats.instalados} instalados</p>
                    <p>{tecnicoStats.total} no total</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editingTecnico && (
        <TecnicoEditModal
          tecnico={editingTecnico}
          onClose={() => setEditingTecnico(null)}
          onSaved={() => {
            setEditingTecnico(null)
            loadTecnicos()
          }}
        />
      )}
    </div>
  )
}

const fieldClass =
  'w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold'
const labelClass = 'mb-1 block text-sm font-medium text-ink'

function TecnicoEditModal({
  tecnico,
  onClose,
  onSaved,
}: {
  tecnico: Profile
  onClose: () => void
  onSaved: () => void
}) {
  const [nome, setNome] = useState(tecnico.nome)
  const [telefone, setTelefone] = useState(tecnico.telefone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [loadingAusencias, setLoadingAusencias] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [motivo, setMotivo] = useState('')
  const [savingAusencia, setSavingAusencia] = useState(false)
  const [ausenciaError, setAusenciaError] = useState<string | null>(null)

  useEffect(() => {
    loadAusencias()
  }, [])

  async function loadAusencias() {
    setLoadingAusencias(true)
    const { data } = await supabase
      .from('ausencias')
      .select('*')
      .eq('tecnico_id', tecnico.id)
      .order('data_inicio', { ascending: false })
    setAusencias((data as Ausencia[]) ?? [])
    setLoadingAusencias(false)
  }

  async function handleAddAusencia() {
    setSavingAusencia(true)
    setAusenciaError(null)

    const { error } = await supabase.from('ausencias').insert({
      tecnico_id: tecnico.id,
      data_inicio: dataInicio,
      data_fim: dataFim,
      motivo: motivo || null,
    })

    setSavingAusencia(false)

    if (error) {
      setAusenciaError(error.message)
      return
    }

    setDataInicio('')
    setDataFim('')
    setMotivo('')
    loadAusencias()
  }

  async function handleDeleteAusencia(id: string) {
    if (!confirm('Remover esta ausência?')) return
    await supabase.from('ausencias').delete().eq('id', id)
    loadAusencias()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('profiles')
      .update({ nome, telefone: telefone || null })
      .eq('id', tecnico.id)

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
          <h2 className="flex-1 text-center text-sm font-bold text-paper">Editar técnico</h2>
          <span className="w-[52px]" />
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div>
              <label className={labelClass}>Nome</label>
              <input required value={nome} onChange={(e) => setNome(e.target.value)} className={fieldClass} />
            </div>

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
              <input disabled value={tecnico.email ?? ''} className={`${fieldClass} bg-paper text-muted`} />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="border-t border-line pt-4">
              <label className={labelClass}>Ausências e férias</label>

              {loadingAusencias ? (
                <p className="text-sm text-muted">A carregar...</p>
              ) : ausencias.length === 0 ? (
                <p className="mb-3 text-sm text-muted">Sem ausências registadas.</p>
              ) : (
                <ul className="mb-3 space-y-1.5">
                  {ausencias.map((ausencia) => (
                    <li
                      key={ausencia.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-gold-deep"
                    >
                      <span>
                        {format(new Date(`${ausencia.data_inicio}T00:00:00`), 'dd/MM/yyyy')} –{' '}
                        {format(new Date(`${ausencia.data_fim}T00:00:00`), 'dd/MM/yyyy')}
                        {ausencia.motivo && <span className="text-muted"> · {ausencia.motivo}</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAusencia(ausencia.id)}
                        className="shrink-0 text-xs font-medium text-danger hover:underline"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className={fieldClass}
                />
                <input
                  type="date"
                  required
                  value={dataFim}
                  min={dataInicio || undefined}
                  onChange={(e) => setDataFim(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo (opcional) — ex: férias"
                className={`${fieldClass} mt-2`}
              />
              {ausenciaError && <p className="mt-1 text-xs text-danger">{ausenciaError}</p>}
              <button
                type="button"
                onClick={handleAddAusencia}
                disabled={savingAusencia || !dataInicio || !dataFim}
                className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-paper disabled:opacity-50"
              >
                {savingAusencia ? 'A adicionar...' : '+ Adicionar ausência'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line bg-white px-4 py-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
