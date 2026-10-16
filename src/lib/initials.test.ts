import { describe, expect, it } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
  it('uses the first two letters of a single-word name', () => {
    expect(initials('Madonna')).toBe('MA')
  })

  it('combines the first letter of the first and last name', () => {
    expect(initials('João Pires')).toBe('JP')
  })

  it('ignores middle names', () => {
    expect(initials('Maria Clara Silva')).toBe('MS')
  })

  it('uppercases the result regardless of input casing', () => {
    expect(initials('rui dimas')).toBe('RD')
  })

  it('trims and collapses stray whitespace between names', () => {
    expect(initials('  Ana   Sousa  ')).toBe('AS')
  })
})
