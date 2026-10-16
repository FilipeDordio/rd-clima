import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { pt } from 'date-fns/locale'
import type { JobWithTecnicos } from '../types'

interface CalendarViewProps {
  month: Date
  onMonthChange: (month: Date) => void
  jobsByDate: Map<string, JobWithTecnicos[]>
  onSelectDay: (day: Date) => void
  selectedDay?: Date | null
}

export function CalendarView({
  month,
  onMonthChange,
  jobsByDate,
  onSelectDay,
  selectedDay,
}: CalendarViewProps) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => onMonthChange(subMonths(month, 1))}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-paper"
        >
          ← Anterior
        </button>
        <h2 className="text-base font-bold capitalize text-ink">
          {format(month, 'MMMM yyyy', { locale: pt })}
        </h2>
        <button
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-paper"
        >
          Seguinte →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-muted sm:gap-1 sm:text-xs">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const jobs = jobsByDate.get(key) ?? []
          const selected = selectedDay ? isSameDay(day, selectedDay) : false

          return (
            <button
              key={key}
              onClick={() => onSelectDay(day)}
              className={`flex min-h-14 flex-col items-center gap-0.5 overflow-hidden rounded-lg border p-1 text-left transition hover:border-gold sm:min-h-20 sm:items-start sm:p-1.5 ${
                isSameMonth(day, month) ? 'bg-white' : 'bg-paper text-muted'
              } ${isToday(day) ? 'border-gold' : 'border-line'} ${
                selected ? 'bg-warn-soft ring-2 ring-inset ring-gold' : ''
              }`}
            >
              <span
                className={`text-[11px] font-medium sm:text-xs ${
                  isToday(day) ? 'rounded-full bg-gold px-1.5 text-ink' : ''
                }`}
              >
                {format(day, 'd')}
              </span>
              {jobs.length > 0 && (
                <span className="mt-auto flex h-4 w-4 items-center justify-center rounded-full bg-warn-soft text-[10px] font-medium text-gold-deep sm:h-auto sm:w-full sm:rounded sm:px-1.5 sm:py-0.5 sm:text-center sm:text-xs">
                  <span className="sm:hidden">{jobs.length}</span>
                  <span className="hidden sm:inline">
                    {jobs.length} {jobs.length === 1 ? 'trabalho' : 'trabalhos'}
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
