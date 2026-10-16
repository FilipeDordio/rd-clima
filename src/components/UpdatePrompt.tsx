import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+8px)] z-[70] mx-auto flex w-[92%] max-w-sm items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 shadow-xl sm:bottom-4">
      <p className="text-sm text-paper">Há uma versão nova da app.</p>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white"
      >
        Atualizar
      </button>
    </div>
  )
}
