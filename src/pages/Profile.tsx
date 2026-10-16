import { useEffect, useState, type FormEvent } from 'react'
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { NotificationsToggle } from '../components/NotificationsToggle'

interface Stats {
  totalInstalados: number
  instaladosMes: number
  instaladosSemana: number
  pendentes: number
}

export function Profile() {
  const { profile, reloadProfile } = useAuth()

  const [nome, setNome] = useState(profile?.nome ?? '')
  const [telefone, setTelefone] = useState(profile?.telefone ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [perfilError, setPerfilError] = useState<string | null>(null)
  const [perfilSuccess, setPerfilSuccess] = useState<string | null>(null)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [novaPassword, setNovaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    setNome(profile?.nome ?? '')
    setTelefone(profile?.telefone ?? '')
    setEmail(profile?.email ?? '')
  }, [profile])

  useEffect(() => {
    if (profile) loadStats(profile.id)
  }, [profile?.id])

  async function loadStats(tecnicoId: string) {
    const today = new Date()
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd')

    const [totalInstalados, instaladosMes, instaladosSemana, pendentes] = await Promise.all([
      supabase
        .from('job_tecnicos')
        .select('job:jobs!inner(estado)', { count: 'exact', head: true })
        .eq('tecnico_id', tecnicoId)
        .eq('job.estado', 'instalado'),
      supabase
        .from('job_tecnicos')
        .select('job:jobs!inner(estado, data_agendada)', { count: 'exact', head: true })
        .eq('tecnico_id', tecnicoId)
        .eq('job.estado', 'instalado')
        .gte('job.data_agendada', monthStart)
        .lte('job.data_agendada', monthEnd),
      supabase
        .from('job_tecnicos')
        .select('job:jobs!inner(estado, data_agendada)', { count: 'exact', head: true })
        .eq('tecnico_id', tecnicoId)
        .eq('job.estado', 'instalado')
        .gte('job.data_agendada', weekStart)
        .lte('job.data_agendada', weekEnd),
      supabase
        .from('job_tecnicos')
        .select('job:jobs!inner(estado)', { count: 'exact', head: true })
        .eq('tecnico_id', tecnicoId)
        .eq('job.estado', 'agendado'),
    ])

    setStats({
      totalInstalados: totalInstalados.count ?? 0,
      instaladosMes: instaladosMes.count ?? 0,
      instaladosSemana: instaladosSemana.count ?? 0,
      pendentes: pendentes.count ?? 0,
    })
  }

  async function handleAvatarChange(file: File | null) {
    if (!file || !profile) return
    setUploadingAvatar(true)
    setAvatarError(null)

    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatares')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setAvatarError(uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data } = supabase.storage.from('avatares').getPublicUrl(path)
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', profile.id)

    setUploadingAvatar(false)

    if (updateError) {
      setAvatarError(updateError.message)
      return
    }

    await reloadProfile()
  }

  async function handleSubmitPerfil(e: FormEvent) {
    e.preventDefault()
    if (!profile) return

    setSavingPerfil(true)
    setPerfilError(null)
    setPerfilSuccess(null)

    const { error } = await supabase
      .from('profiles')
      .update({ nome, telefone: telefone || null, email: email || null })
      .eq('id', profile.id)

    setSavingPerfil(false)

    if (error) {
      setPerfilError(error.message)
      return
    }

    setPerfilSuccess('Perfil atualizado.')
    await reloadProfile()
  }

  async function handleSubmitPassword(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (novaPassword !== confirmarPassword) {
      setPasswordError('As palavras-passe não coincidem.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: novaPassword })
    setSavingPassword(false)

    if (error) {
      setPasswordError(error.message)
      return
    }

    setPasswordSuccess('Palavra-passe alterada.')
    setNovaPassword('')
    setConfirmarPassword('')
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-ink">Perfil</h2>

        <div className="mb-4 flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.nome}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warn-soft text-xl font-semibold text-gold-deep">
              {profile.nome.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <label className="inline-block cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper">
              {uploadingAvatar ? 'A enviar...' : 'Alterar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
              />
            </label>
            {avatarError && <p className="mt-1 text-xs text-danger">{avatarError}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmitPerfil} className="grid gap-3 sm:grid-cols-2">
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
            <label className="mb-1 block text-sm font-medium text-ink">Telemóvel</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="9XX XXX XXX"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <p className="mt-1 text-xs text-muted">
              Email de contacto. Não altera o email de acesso à conta.
            </p>
          </div>

          {perfilError && <p className="text-sm text-danger sm:col-span-2">{perfilError}</p>}
          {perfilSuccess && (
            <p className="text-sm text-success sm:col-span-2">{perfilSuccess}</p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingPerfil}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white disabled:opacity-60"
            >
              {savingPerfil ? 'A guardar...' : 'Guardar alterações'}
            </button>
          </div>
        </form>
      </div>

      <NotificationsToggle userId={profile.id} />

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-ink">Alterar palavra-passe</h2>

        <form onSubmit={handleSubmitPassword} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Nova palavra-passe</label>
            <input
              required
              type="password"
              minLength={6}
              value={novaPassword}
              onChange={(e) => setNovaPassword(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Confirmar</label>
            <input
              required
              type="password"
              minLength={6}
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {passwordError && <p className="text-sm text-danger sm:col-span-2">{passwordError}</p>}
          {passwordSuccess && (
            <p className="text-sm text-success sm:col-span-2">{passwordSuccess}</p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white disabled:opacity-60"
            >
              {savingPassword ? 'A guardar...' : 'Alterar palavra-passe'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-ink">Os meus trabalhos</h2>

        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Esta semana', value: stats.instaladosSemana },
              { label: 'Este mês', value: stats.instaladosMes },
              { label: 'Total instalados', value: stats.totalInstalados },
              { label: 'Pendentes', value: stats.pendentes },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-line bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-muted">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-ink">{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
