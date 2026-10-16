import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JobForm } from './JobForm'
import { supabase } from '../lib/supabase'
import type { ModeloEquipamento } from '../types'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const fromMock = vi.mocked(supabase.from)

type Result = { data: unknown; error: unknown }

// Builds a fake Supabase query-builder chain: every method returns the same
// object (so calls can be chained in any order the component uses) except
// `terminal`, which resolves the awaited/`.then`-ed promise — mirroring how
// the real postgrest-js builder is itself thenable at the end of a chain.
function chainable(terminal: string, result: Result) {
  const obj: Record<string, ReturnType<typeof vi.fn>> = {}
  for (const method of ['select', 'eq', 'lte', 'gte', 'order', 'insert', 'update', 'delete']) {
    obj[method] = vi.fn(() => (method === terminal ? Promise.resolve(result) : obj))
  }
  obj.single = vi.fn(() => Promise.resolve(result))
  return obj
}

const mockModelos: ModeloEquipamento[] = [
  { id: 'ac-1', tipo_servico: 'ar_condicionado', nome: '12000 BTU', created_at: '' },
  { id: 'bc-1', tipo_servico: 'bomba_calor', nome: 'Daikin Altherma', created_at: '' },
]

let modelosBuilder: ReturnType<typeof chainable>
let jobsBuilder: ReturnType<typeof chainable>

beforeEach(() => {
  const ausenciasBuilder = chainable('gte', { data: [], error: null })
  modelosBuilder = chainable('order', { data: mockModelos, error: null })
  jobsBuilder = chainable('', { data: { id: 'job-1' }, error: null })
  const jobTecnicosBuilder = chainable('eq', { data: null, error: null })

  fromMock.mockImplementation((table: string) => {
    switch (table) {
      case 'ausencias':
        return ausenciasBuilder as never
      case 'modelos_equipamento':
        return modelosBuilder as never
      case 'jobs':
        return jobsBuilder as never
      case 'job_tecnicos':
        return jobTecnicosBuilder as never
      default:
        return chainable('select', { data: [], error: null }) as never
    }
  })
})

function fieldFor(labelText: string) {
  return screen.getByText(labelText).nextElementSibling as HTMLInputElement
}

describe('JobForm — catálogo de modelos de equipamento', () => {
  it('fetches models scoped to the selected equipment type and saves the chosen one', async () => {
    const onSaved = vi.fn()
    render(<JobForm tecnicos={[]} clientes={[]} onClose={() => {}} onSaved={onSaved} />)

    await userEvent.click(screen.getByText('Bomba de Calor'))

    await waitFor(() =>
      expect(modelosBuilder.eq).toHaveBeenCalledWith('tipo_servico', 'bomba_calor'),
    )
    expect(await screen.findByText('Daikin Altherma')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Daikin Altherma'))
    await userEvent.type(fieldFor('Cliente'), 'Cliente Teste')
    await userEvent.type(fieldFor('Localização'), 'Rua Teste 123')

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(jobsBuilder.insert).toHaveBeenCalled())
    expect(jobsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ tipo_servico: 'bomba_calor', tipo_ac: 'Daikin Altherma' }),
    )
    expect(onSaved).toHaveBeenCalled()
  })

  it('keeps Multi and Pré instalação exclusive to Ar Condicionado, with no free-text description', async () => {
    render(<JobForm tecnicos={[]} clientes={[]} onClose={() => {}} onSaved={() => {}} />)

    expect(await screen.findByText('12000 BTU')).toBeInTheDocument()
    expect(screen.getByText('Multi')).toBeInTheDocument()
    expect(screen.getByText('Pré instalação')).toBeInTheDocument()
    expect(screen.queryByText('Descrição do trabalho')).not.toBeInTheDocument()
  })

  it('shows a plain description field, with no model picker, for non-equipment service types', async () => {
    render(<JobForm tecnicos={[]} clientes={[]} onClose={() => {}} onSaved={() => {}} />)

    await userEvent.click(screen.getByText('Instalação Hidráulica'))

    expect(screen.queryByText('Modelo')).not.toBeInTheDocument()
    expect(screen.getByText('Descrição do trabalho')).toBeInTheDocument()
  })
})
