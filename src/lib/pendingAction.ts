const KEY = 'rdclima:pending-mark-installed'

interface PendingMarkInstalled {
  jobId: string
  notas: string
}

/**
 * Guarda em sessionStorage qual o trabalho a marcar como instalado e as notas
 * já escritas, antes de abrir a câmara/galeria. Se o telemóvel descartar a
 * página em segundo plano (gestão de memória do Android) e ela recarregar do
 * zero, isto permite reabrir o mesmo modal com as notas em vez de perder tudo
 * silenciosamente.
 */
export function savePendingMarkInstalled(jobId: string, notas: string) {
  sessionStorage.setItem(KEY, JSON.stringify({ jobId, notas }))
}

export function readPendingMarkInstalled(): PendingMarkInstalled | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PendingMarkInstalled
  } catch {
    return null
  }
}

export function clearPendingMarkInstalled() {
  sessionStorage.removeItem(KEY)
}
