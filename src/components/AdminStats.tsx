import { useEffect, useState } from 'react'
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { supabase } from '../lib/supabase'

interface Stats {
  hojeTotal: number
  hojeInstalados: number
  semanaTotal: number
  atrasados: number
  instaladosMes: number
}

export function AdminStats({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    loadStats()
  }, [refreshKey])

  async function loadStats() {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd')

    const [hoje, semana, atrasados, instaladosMes] = await Promise.all([
      supabase.from('jobs').select('estado').eq('data_agendada', todayStr),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .gte('data_agendada', weekStart)
        .lte('data_agendada', weekEnd),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'agendado')
        .lt('data_agendada', todayStr),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'instalado')
        .gte('data_agendada', monthStart)
        .lte('data_agendada', monthEnd),
    ])

    const hojeJobs = hoje.data ?? []

    setStats({
      hojeTotal: hojeJobs.length,
      hojeInstalados: hojeJobs.filter((j) => j.estado === 'instalado').length,
      semanaTotal: semana.count ?? 0,
      atrasados: atrasados.count ?? 0,
      instaladosMes: instaladosMes.count ?? 0,
    })
  }

  if (!stats) return null

  const cards = [
    {
      label: 'Hoje',
      value: `${stats.hojeInstalados}/${stats.hojeTotal}`,
      hint: 'instalados',
    },
    { label: 'Esta semana', value: stats.semanaTotal, hint: 'trabalhos agendados' },
    { label: 'Atrasados', value: stats.atrasados, hint: 'pendentes', highlight: stats.atrasados > 0 },
    { label: 'Instalados este mês', value: stats.instaladosMes, hint: 'concluídos' },
  ]

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-3 shadow-sm ${
            card.highlight ? 'border-danger/30 bg-danger-soft' : 'border-line bg-white'
          }`}
        >
          <p className="text-xs font-medium text-muted">{card.label}</p>
          <p
            className={`mt-1 text-2xl font-bold ${card.highlight ? 'text-danger' : 'text-ink'}`}
          >
            {card.value}
          </p>
          <p className="text-xs text-muted">{card.hint}</p>
        </div>
      ))}
    </div>
  )
}
