import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { subMonths } from 'date-fns'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CalendarView } from './CalendarView'
import type { JobWithTecnicos } from '../types'

const AUGUST_15_2026 = new Date(2026, 7, 15)

afterEach(() => {
  vi.useRealTimers()
})

describe('CalendarView', () => {
  it('shows the month and year being viewed', () => {
    render(
      <CalendarView
        month={AUGUST_15_2026}
        onMonthChange={() => {}}
        jobsByDate={new Map()}
        onSelectDay={() => {}}
      />,
    )

    expect(screen.getByText('agosto 2026')).toBeInTheDocument()
  })

  it('renders the seven weekday headers', () => {
    render(
      <CalendarView
        month={AUGUST_15_2026}
        onMonthChange={() => {}}
        jobsByDate={new Map()}
        onSelectDay={() => {}}
      />,
    )

    for (const day of ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }
  })

  it('renders full weeks of day cells (a multiple of 7)', () => {
    render(
      <CalendarView
        month={AUGUST_15_2026}
        onMonthChange={() => {}}
        jobsByDate={new Map()}
        onSelectDay={() => {}}
      />,
    )

    // 2 nav buttons ("Anterior"/"Seguinte") + one button per day cell.
    const dayButtons = screen.getAllByRole('button').length - 2
    expect(dayButtons).toBeGreaterThanOrEqual(31)
    expect(dayButtons % 7).toBe(0)
  })

  it('calls onMonthChange with the previous month when "Anterior" is clicked', async () => {
    const onMonthChange = vi.fn()
    render(
      <CalendarView
        month={AUGUST_15_2026}
        onMonthChange={onMonthChange}
        jobsByDate={new Map()}
        onSelectDay={() => {}}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /Anterior/ }))

    expect(onMonthChange).toHaveBeenCalledWith(subMonths(AUGUST_15_2026, 1))
  })

  it('calls onSelectDay with the clicked date', async () => {
    const onSelectDay = vi.fn()
    render(
      <CalendarView
        month={AUGUST_15_2026}
        onMonthChange={() => {}}
        jobsByDate={new Map()}
        onSelectDay={onSelectDay}
      />,
    )

    await userEvent.click(screen.getByText('15'))

    expect(onSelectDay).toHaveBeenCalledTimes(1)
    const clickedDay = onSelectDay.mock.calls[0][0] as Date
    expect(clickedDay.getFullYear()).toBe(2026)
    expect(clickedDay.getMonth()).toBe(7)
    expect(clickedDay.getDate()).toBe(15)
  })

  it('shows a job count badge only for days that have jobs scheduled', () => {
    const jobsByDate = new Map<string, JobWithTecnicos[]>([
      ['2026-08-15', [{} as JobWithTecnicos, {} as JobWithTecnicos]],
    ])

    render(
      <CalendarView
        month={AUGUST_15_2026}
        onMonthChange={() => {}}
        jobsByDate={jobsByDate}
        onSelectDay={() => {}}
      />,
    )

    expect(screen.getByText('2 trabalhos')).toBeInTheDocument()
  })

  it('highlights today\'s cell', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 15, 10, 0, 0))

    render(
      <CalendarView
        month={AUGUST_15_2026}
        onMonthChange={() => {}}
        jobsByDate={new Map()}
        onSelectDay={() => {}}
      />,
    )

    expect(screen.getByText('15')).toHaveClass('bg-gold')
  })
})
