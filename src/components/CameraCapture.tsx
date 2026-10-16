import { useEffect, useRef, useState } from 'react'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onClose: () => void
}

/**
 * Câmara dentro da própria página (getUserMedia), em vez de abrir a app de
 * câmara nativa via <input capture>. Em telemóvel, sair da página para a app
 * de câmara e voltar pode fazer a PWA recarregar do zero a meio — perdendo o
 * modal aberto e a foto. Ficar dentro da página evita essa troca de app.
 */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setError('Não foi possível aceder à câmara.'))

    return () => {
      active = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function handleCapture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], `instalacao-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.9,
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-white/80 transition hover:text-white"
        >
          Cancelar
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <p className="flex h-full items-center justify-center px-8 text-center text-sm text-white/80">
            {error}
          </p>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        )}
      </div>

      {!error && (
        <div className="flex items-center justify-center py-6">
          <button
            type="button"
            onClick={handleCapture}
            aria-label="Tirar foto"
            className="h-16 w-16 rounded-full border-4 border-white bg-white/20 transition active:bg-white/40"
          />
        </div>
      )}
    </div>
  )
}
