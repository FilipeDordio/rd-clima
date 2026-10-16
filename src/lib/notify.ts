export function buildWhatsAppLink(telefone: string, mensagem: string) {
  const digits = telefone.replace(/\D/g, '')
  const comIndicativo = digits.startsWith('351') ? digits : `351${digits}`
  return `https://wa.me/${comIndicativo}?text=${encodeURIComponent(mensagem)}`
}

export function buildEmailLink(email: string, assunto: string, mensagem: string) {
  return `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`
}
