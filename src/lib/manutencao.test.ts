import { describe, expect, it } from 'vitest'
import { combinarMesDia, formatarProximaManutencao, separarMesDia } from './manutencao'

describe('combinarMesDia', () => {
  it('returns null when no month is given', () => {
    expect(combinarMesDia('', '')).toBeNull()
  })

  it('defaults to day 1 and diaCerto=false when only the month is given', () => {
    expect(combinarMesDia('2027-07', '')).toEqual({ data: '2027-07-01', diaCerto: false })
  })

  it('uses the given day and diaCerto=true when a day is provided', () => {
    expect(combinarMesDia('2027-07', '12')).toEqual({ data: '2027-07-12', diaCerto: true })
  })

  it('clamps an out-of-range day into the valid 1-31 window', () => {
    expect(combinarMesDia('2027-07', '99')).toEqual({ data: '2027-07-31', diaCerto: true })
    expect(combinarMesDia('2027-07', '0')).toEqual({ data: '2027-07-01', diaCerto: true })
  })
})

describe('separarMesDia', () => {
  it('returns empty strings for a null date', () => {
    expect(separarMesDia(null, false)).toEqual({ mes: '', dia: '' })
  })

  it('splits an exact date into month and day', () => {
    expect(separarMesDia('2027-07-12', true)).toEqual({ mes: '2027-07', dia: '12' })
  })

  it('omits the day when only the month was known', () => {
    expect(separarMesDia('2027-07-01', false)).toEqual({ mes: '2027-07', dia: '' })
  })
})

describe('formatarProximaManutencao', () => {
  it('shows the full date when the day is certain', () => {
    expect(formatarProximaManutencao('2027-07-12', true)).toBe('12 de julho de 2027')
  })

  it('shows only month and year when the day is approximate', () => {
    expect(formatarProximaManutencao('2027-07-01', false)).toBe('julho de 2027')
  })
})
