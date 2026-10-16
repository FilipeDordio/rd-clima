import { useEffect, useState } from 'react'
import {
  getPushSubscriptionState,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/pushNotifications'

type State = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

interface NotificationsToggleProps {
  userId: string
}

export function NotificationsToggle({ userId }: NotificationsToggleProps) {
  const [state, setState] = useState<State>('loading')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getPushSubscriptionState().then(setState)
  }, [])

  async function handleToggle() {
    setBusy(true)
    setError(null)
    try {
      if (state === 'subscribed') {
        await unsubscribeFromPush()
        setState('unsubscribed')
      } else {
        await subscribeToPush(userId)
        setState('subscribed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar as notificações.')
      setState(await getPushSubscriptionState())
    }
    setBusy(false)
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-base font-bold text-ink">Notificações</h2>

      {state === 'unsupported' ? (
        <p className="text-sm text-muted">
          O teu navegador não suporta notificações push.
        </p>
      ) : state === 'denied' ? (
        <p className="text-sm text-muted">
          As notificações estão bloqueadas. Ativa-as nas definições do navegador para este site.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Recebe um aviso instantâneo quando te atribuírem um trabalho ou quando um trabalho for
            marcado como instalado.
          </p>
          <button
            onClick={handleToggle}
            disabled={busy || state === 'loading'}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${
              state === 'subscribed'
                ? 'border border-line text-ink hover:bg-paper'
                : 'bg-gold text-ink hover:bg-gold-deep hover:text-white'
            }`}
          >
            {state === 'subscribed' ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  )
}
