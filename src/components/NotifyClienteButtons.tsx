import { buildEmailLink, buildWhatsAppLink } from '../lib/notify'
import { IconMail, IconWhatsApp } from './icons'

interface NotifyClienteButtonsProps {
  telefone?: string | null
  email?: string | null
  assunto: string
  mensagem: string
}

export function NotifyClienteButtons({ telefone, email, assunto, mensagem }: NotifyClienteButtonsProps) {
  if (!telefone && !email) return null

  const linkClass =
    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-paper'

  return (
    <div className="flex gap-2">
      {telefone && (
        <a
          href={buildWhatsAppLink(telefone, mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={linkClass}
        >
          <IconWhatsApp className="h-4 w-4" />
          WhatsApp
        </a>
      )}
      {email && (
        <a
          href={buildEmailLink(email, assunto, mensagem)}
          onClick={(e) => e.stopPropagation()}
          className={linkClass}
        >
          <IconMail className="h-4 w-4" />
          Email
        </a>
      )}
    </div>
  )
}
