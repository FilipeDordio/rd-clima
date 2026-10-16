import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { notifyUsers } from '../lib/sendPushNotification'
import { useAuth } from '../contexts/AuthContext'
import type { Job } from '../types'

interface MarkNotInstalledModalProps {
  job: Job
  onClose: () => void
  onSaved: () => void
}

export function MarkNotInstalledModal({ job, onClose, onSaved }: MarkNotInstalledModalProps) {
  const { profile } = useAuth()
  const [motivo, setMotivo] = useState(job.motivo_nao_instalado ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ estado: 'nao_instalado', motivo_nao_instalado: motivo })
      .eq('id', job.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
    notifyUsers(
      (admins ?? []).map((admin) => admin.id),
      {
        title: 'Trabalho não instalado',
        body: `${profile?.nome ?? 'Um técnico'} não conseguiu instalar em ${job.cliente} — precisa de remarcação.`,
        url: '/admin/por-remarcar',
      },
    )

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
            Marcar como não instalado
            <span className="block text-xs font-medium text-paper/50">
              {job.cliente} — {job.endereco}
            </span>
          </h2>
          <span className="w-[52px]" />
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Motivo</label>
              <textarea
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="Ex: cliente não estava, faltou material, acesso impossível..."
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line bg-white px-4 py-3">
            <span />
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90 disabled:opacity-60 sm:flex-none"
            >
              {saving ? 'A guardar...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
