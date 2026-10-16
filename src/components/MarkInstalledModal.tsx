import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { notifyUsers } from '../lib/sendPushNotification'
import { useAuth } from '../contexts/AuthContext'
import { CameraCapture } from './CameraCapture'
import { clearPendingMarkInstalled, savePendingMarkInstalled } from '../lib/pendingAction'
import type { Job } from '../types'

interface MarkInstalledModalProps {
  job: Job
  initialNotas?: string
  resumed?: boolean
  onClose: () => void
  onSaved: () => void
}

export function MarkInstalledModal({
  job,
  initialNotas,
  resumed,
  onClose,
  onSaved,
}: MarkInstalledModalProps) {
  const { profile } = useAuth()
  const [notas, setNotas] = useState(initialNotas ?? job.notas ?? '')
  const [foto, setFoto] = useState<File | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fotoPreviewUrl = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto])

  useEffect(() => {
    return () => {
      if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    }
  }, [fotoPreviewUrl])

  useEffect(() => {
    savePendingMarkInstalled(job.id, notas)
  }, [job.id, notas])

  function handleClose() {
    clearPendingMarkInstalled()
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    let fotoUrl = job.foto_url

    if (foto) {
      const path = `${job.id}/${Date.now()}-${foto.name}`
      const { error: uploadError } = await supabase.storage
        .from('instalacoes')
        .upload(path, foto, { upsert: true })

      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from('instalacoes').getPublicUrl(path)
      fotoUrl = data.publicUrl
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ estado: 'instalado', notas, foto_url: fotoUrl })
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
        title: 'Trabalho instalado',
        body: `${profile?.nome ?? 'Um técnico'} marcou ${job.cliente} como instalado.`,
        url: '/admin',
      },
    )

    clearPendingMarkInstalled()
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white sm:items-center sm:justify-center sm:bg-black/40 sm:p-4">
      <div className="flex h-full w-full flex-col sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:overflow-hidden sm:rounded-xl sm:shadow-lg">
        <div className="flex items-center gap-2 bg-ink px-4 py-3.5">
          <button
            type="button"
            onClick={handleClose}
            className="text-sm font-medium text-paper/70 transition hover:text-paper"
          >
            Cancelar
          </button>
          <h2 className="flex-1 text-center text-sm font-bold text-paper">
            Marcar como instalado
            <span className="block text-xs font-medium text-paper/50">
              {job.cliente} — {job.endereco}
            </span>
          </h2>
          <span className="w-[52px]" />
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {resumed && (
              <p className="rounded-lg bg-warn-soft px-3 py-2 text-xs text-gold-deep">
                Retomámos as notas que estavas a escrever — a foto perdeu-se, escolhe-a outra vez.
              </p>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Notas</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="Observações sobre a instalação..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Foto</label>
              {fotoPreviewUrl && (
                <img
                  src={fotoPreviewUrl}
                  alt="Pré-visualização da foto"
                  className="mb-2 h-40 w-full rounded-lg object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-paper"
              >
                {fotoPreviewUrl ? 'Tirar outra foto' : 'Tirar foto'}
              </button>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line bg-white px-4 py-3">
            <span />
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-success/90 disabled:opacity-60 sm:flex-none"
            >
              {saving ? 'A guardar...' : 'Confirmar instalação'}
            </button>
          </div>
        </form>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={(file) => {
            setFoto(file)
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}
