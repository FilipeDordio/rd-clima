import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Chip } from './Chip'

describe('Chip', () => {
  it('renders its children as the button label', () => {
    render(
      <Chip selected={false} onClick={() => {}}>
        Ar Condicionado
      </Chip>,
    )

    expect(screen.getByRole('button', { name: 'Ar Condicionado' })).toBeInTheDocument()
  })

  it('applies the selected styling when selected is true', () => {
    render(
      <Chip selected onClick={() => {}}>
        Selecionado
      </Chip>,
    )

    expect(screen.getByRole('button')).toHaveClass('bg-gold')
  })

  it('does not apply the selected styling when selected is false', () => {
    render(
      <Chip selected={false} onClick={() => {}}>
        Por selecionar
      </Chip>,
    )

    expect(screen.getByRole('button')).not.toHaveClass('bg-gold')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(
      <Chip selected={false} onClick={onClick}>
        Bomba de Calor
      </Chip>,
    )

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
