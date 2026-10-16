import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminSettings } from './AdminSettings'
import { supabase } from '../lib/supabase'
import type { ModeloEquipamento } from '../types'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const fromMock = vi.mocked(supabase.from)

const mockModelos: ModeloEquipamento[] = [
  { id: '1', tipo_servico: 'ar_condicionado', nome: '9000 BTU', created_at: '' },
  { id: '2', tipo_servico: 'ar_condicionado', nome: '12000 BTU', created_at: '' },
  { id: '3', tipo_servico: 'bomba_calor', nome: 'Daikin Altherma', created_at: '' },
]

let insertMock: ReturnType<typeof vi.fn>
let deleteEqMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  insertMock = vi.fn().mockResolvedValue({ error: null })
  deleteEqMock = vi.fn().mockResolvedValue({ error: null })

  fromMock.mockImplementation(
    () =>
      ({
        select: () => ({ order: () => Promise.resolve({ data: mockModelos }) }),
        insert: insertMock,
        delete: () => ({ eq: deleteEqMock }),
      }) as never,
  )
})

describe('AdminSettings', () => {
  it('shows a section per equipment type and lists its models', async () => {
    render(<AdminSettings />)

    expect(await screen.findByText('Ar Condicionado')).toBeInTheDocument()
    expect(screen.getByText('Bomba de Calor')).toBeInTheDocument()
    expect(screen.getByText('Solar Térmico')).toBeInTheDocument()

    expect(screen.getByText('9000 BTU')).toBeInTheDocument()
    expect(screen.getByText('12000 BTU')).toBeInTheDocument()
    expect(screen.getByText('Daikin Altherma')).toBeInTheDocument()
  })

  it('shows an empty state for a type with no models yet', async () => {
    render(<AdminSettings />)
    await screen.findByText('Ar Condicionado')

    const solarSection = screen.getByText('Solar Térmico').closest('div') as HTMLElement
    expect(within(solarSection).getByText(/ainda não há modelos registados/i)).toBeInTheDocument()
  })

  it('adds a new model to the correct type when the form is submitted', async () => {
    render(<AdminSettings />)
    await screen.findByText('Ar Condicionado')

    const acSection = screen.getByText('Ar Condicionado').closest('div') as HTMLElement
    await userEvent.type(
      within(acSection).getByPlaceholderText('Ex: Haier Flexis Plus 12000 BTU'),
      'Haier 12000 BTU',
    )
    await userEvent.click(within(acSection).getByText('Adicionar'))

    await waitFor(() =>
      expect(insertMock).toHaveBeenCalledWith({ tipo_servico: 'ar_condicionado', nome: 'Haier 12000 BTU' }),
    )
  })

  it('removes a model after the admin confirms', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<AdminSettings />)
    await screen.findByText('9000 BTU')

    await userEvent.click(screen.getAllByText('Remover')[0])

    await waitFor(() => expect(deleteEqMock).toHaveBeenCalledWith('id', '1'))
  })

  it('does not delete when the admin cancels the confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<AdminSettings />)
    await screen.findByText('9000 BTU')

    await userEvent.click(screen.getAllByText('Remover')[0])

    expect(deleteEqMock).not.toHaveBeenCalled()
  })
})
