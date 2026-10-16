import { describe, expect, it } from 'vitest'
import { mapJobsWithTecnicos } from './jobTecnicos'

describe('mapJobsWithTecnicos', () => {
  it('returns an empty array when rows is null', () => {
    expect(mapJobsWithTecnicos(null)).toEqual([])
  })

  it('returns an empty array when rows is empty', () => {
    expect(mapJobsWithTecnicos([])).toEqual([])
  })

  it('flattens job_tecnicos into a tecnicos array', () => {
    const rows = [
      {
        id: 'job-1',
        cliente: 'Maria Silva',
        job_tecnicos: [
          { tecnico: { id: 'tec-1', nome: 'João Pires' } },
          { tecnico: { id: 'tec-2', nome: 'Carlos Reis' } },
        ],
      },
    ]

    const result = mapJobsWithTecnicos(rows)

    expect(result).toHaveLength(1)
    expect(result[0].tecnicos).toEqual([
      { id: 'tec-1', nome: 'João Pires' },
      { id: 'tec-2', nome: 'Carlos Reis' },
    ])
  })

  it('drops the raw job_tecnicos key from the mapped job', () => {
    const rows = [{ id: 'job-1', cliente: 'Maria Silva', job_tecnicos: [] }]

    const result = mapJobsWithTecnicos(rows)

    expect(result[0]).not.toHaveProperty('job_tecnicos')
    expect(result[0]).toMatchObject({ id: 'job-1', cliente: 'Maria Silva' })
  })

  it('filters out assignments with no linked tecnico (e.g. a deleted profile)', () => {
    const rows = [
      {
        id: 'job-1',
        job_tecnicos: [{ tecnico: null }, { tecnico: { id: 'tec-1', nome: 'João Pires' } }],
      },
    ]

    const result = mapJobsWithTecnicos(rows)

    expect(result[0].tecnicos).toEqual([{ id: 'tec-1', nome: 'João Pires' }])
  })

  it('defaults tecnicos to an empty array when job_tecnicos is missing', () => {
    const rows = [{ id: 'job-1', cliente: 'Maria Silva' }]

    const result = mapJobsWithTecnicos(rows)

    expect(result[0].tecnicos).toEqual([])
  })
})
