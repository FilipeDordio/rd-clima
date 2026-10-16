import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { JobCard } from './JobCard'
import type { JobWithTecnicos } from '../types'

function buildJob(overrides: Partial<JobWithTecnicos> = {}): JobWithTecnicos {
  return {
    id: 'job-1',
    cliente_id: null,
    cliente: 'Maria Silva',
    endereco: 'Rua das Flores 12, Portalegre',
    tipo_servico: 'ar_condicionado',
    tipo_ac: '18000 BTU',
    multi: false,
    unidades_exteriores: null,
    pre_instalacao: null,
    descricao: null,
    quantidade: 1,
    data_agendada: '2026-08-11',
    hora_agendada: '09:00:00',
    estado: 'agendado',
    notas: null,
    foto_url: null,
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
    tecnicos: [],
    ...overrides,
  }
}

describe('JobCard', () => {
  it('shows the client name and the scheduled time', () => {
    render(<JobCard job={buildJob({ hora_agendada: '14:30:00' })} />)

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('14:30')).toBeInTheDocument()
  })

  it.each([
    ['agendado', 'Agendado'],
    ['instalado', 'Instalado'],
    ['cancelado', 'Cancelado'],
  ] as const)('shows the %s status as "%s"', (estado, label) => {
    render(<JobCard job={buildJob({ estado })} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('links the address to a Google Maps search', () => {
    render(<JobCard job={buildJob({ endereco: 'Av. da Liberdade 88, Elvas' })} />)

    const link = screen.getByRole('link', { name: /Av\. da Liberdade 88, Elvas/ })
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=Av.%20da%20Liberdade%2088%2C%20Elvas',
    )
  })

  it('shows AC details (type and multi units) only for ar_condicionado jobs', () => {
    render(
      <JobCard
        job={buildJob({
          tipo_servico: 'ar_condicionado',
          tipo_ac: '24000 BTU',
          multi: true,
          unidades_exteriores: 3,
        })}
      />,
    )

    expect(screen.getByText('24000 BTU')).toBeInTheDocument()
    expect(screen.getByText('Multi · 3 ext.')).toBeInTheDocument()
  })

  it('does not show AC-only tags for non-AC service types', () => {
    render(
      <JobCard
        job={buildJob({
          tipo_servico: 'hidraulica',
          tipo_ac: '24000 BTU',
          multi: true,
          unidades_exteriores: 3,
          descricao: 'Substituição de tubagem',
        })}
      />,
    )

    expect(screen.queryByText('24000 BTU')).not.toBeInTheDocument()
    expect(screen.queryByText('Multi · 3 ext.')).not.toBeInTheDocument()
    expect(screen.getByText('Substituição de tubagem')).toBeInTheDocument()
  })

  it('shows the pré-instalação label when set', () => {
    render(<JobCard job={buildJob({ pre_instalacao: 'nao_tem' })} />)

    expect(screen.getByText('Não tem')).toBeInTheDocument()
  })

  it('renders the children actions passed to it', () => {
    render(
      <JobCard job={buildJob()}>
        <button>Marcar como instalado</button>
      </JobCard>,
    )

    expect(screen.getByRole('button', { name: 'Marcar como instalado' })).toBeInTheDocument()
  })

  it('renders the installation photo when foto_url is present', () => {
    render(<JobCard job={buildJob({ foto_url: 'https://example.com/foto.jpg' })} />)

    expect(screen.getByRole('img', { name: /Maria Silva/ })).toHaveAttribute(
      'src',
      'https://example.com/foto.jpg',
    )
  })
})
