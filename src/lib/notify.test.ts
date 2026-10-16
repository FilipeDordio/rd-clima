import { describe, expect, it } from 'vitest'
import { buildEmailLink, buildWhatsAppLink } from './notify'

describe('buildWhatsAppLink', () => {
  it('adds the Portuguese country code to a local number', () => {
    const link = buildWhatsAppLink('912345678', 'Olá!')
    expect(link).toBe('https://wa.me/351912345678?text=Ol%C3%A1!')
  })

  it('strips spaces and dashes from the phone number', () => {
    const link = buildWhatsAppLink('912 345 678', 'Oi')
    expect(link).toContain('https://wa.me/351912345678')
  })

  it('does not double the country code if it is already present', () => {
    const link = buildWhatsAppLink('351912345678', 'Oi')
    expect(link).toContain('https://wa.me/351912345678')
    expect(link).not.toContain('351351')
  })
})

describe('buildEmailLink', () => {
  it('builds a mailto link with encoded subject and body', () => {
    const link = buildEmailLink('cliente@mail.pt', 'Assunto & mais', 'Corpo do email')
    expect(link).toBe('mailto:cliente@mail.pt?subject=Assunto%20%26%20mais&body=Corpo%20do%20email')
  })
})
