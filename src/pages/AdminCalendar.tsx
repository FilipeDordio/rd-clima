import { useEffect, useState } from 'react'
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { pt } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { mapJobsWithTecnicos } from '../lib/jobTecnicos'
import { AdminStats } from '../components/AdminStats'
import { CalendarView } from '../components/CalendarView'
import { JobCard } from '../components/JobCard'
import { JobForm } from '../components/JobForm'
import { ProximasManutencoes } from '../components/ProximasManutencoes'
import type { Cliente, JobWithTecnicos, Profile } from '../types'

export function AdminCalendar() {
  const [month, setMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [jobs, setJobs] = useState<JobWithTecnicos[]>([])
  const [tecnicos, setTecnicos] = useState<Profile[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [editingJob, setEditingJob] = useState<JobWithTecnicos | null | 'new'>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadTecnicos()
    loadClientes()
  }, [])

  useEffect(() => {
    loadJobs()
  }, [month])

  async function loadTecnicos() {
    const { data } = await supabase.from('profiles').select('*').in('role', ['admin', 'tecnico']).order('nome')
    setTecnicos((data as Profile[]) ?? [])
  }

  async function loadClientes() {
    const { data } = await supabase.from('clientes').select('*').order('nome')
    setClientes((data as Cliente[]) ?? [])
  }

  async function loadJobs() {
    setLoading(true)
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })

    const { data, error } = await supabase
      .from('jobs')
      .select('*, job_tecnicos(tecnico:profiles(id, nome))')
      .gte('data_agendada', format(start, 'yyyy-MM-dd'))
      .lte('data_agendada', format(end, 'yyyy-MM-dd'))
      .order('data_agendada', { ascending: true })

    if (!error) {
      setJobs(mapJobsWithTecnicos(data))
    }
    setLoading(false)
  }

  const jobsByDate = new Map<string, JobWithTecnicos[]>()
  for (const job of jobs) {
    const list = jobsByDate.get(job.data_agendada) ?? []
    list.push(job)
    jobsByDate.set(job.data_agendada, list)
  }

  const selectedKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const dayJobs = selectedKey
    ? [...(jobsByDate.get(selectedKey) ?? [])].sort((a, b) =>
        (a.hora_agendada ?? '99:99').localeCompare(b.hora_agendada ?? '99:99'),
      )
    : []

  return (
    <div>
      <AdminStats refreshKey={refreshKey} />
      <ProximasManutencoes tecnicos={tecnicos} clientes={clientes} />

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-line bg-white p-2 shadow-sm sm:p-4">
          {loading && <p className="mb-2 text-sm text-muted">A carregar...</p>}
          <CalendarView
            month={month}
            onMonthChange={setMonth}
            jobsByDate={jobsByDate}
            onSelectDay={setSelectedDay}
            selectedDay={selectedDay}
          />
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          {selectedDay ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold capitalize text-ink">
                  {format(selectedDay, "EEEE, d 'de' MMMM", { locale: pt })}
                </h3>
                <button
                  onClick={() => setEditingJob('new')}
                  className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-gold-deep hover:text-white"
                >
                  + Adicionar
                </button>
              </div>

              {dayJobs.length === 0 ? (
                <p className="text-sm text-muted">Sem trabalhos agendados.</p>
              ) : (
                <div className="space-y-3">
                  {dayJobs.map((job) => (
                    <div key={job.id} onClick={() => setEditingJob(job)} className="cursor-pointer">
                      <JobCard job={job} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">Seleciona um dia no calendário.</p>
          )}
        </div>
      </div>

      {editingJob && selectedKey && (
        <JobForm
          data={selectedKey}
          job={editingJob === 'new' ? null : editingJob}
          tecnicos={tecnicos}
          clientes={clientes}
          onClose={() => setEditingJob(null)}
          onSaved={() => {
            setEditingJob(null)
            loadJobs()
            setRefreshKey((k) => k + 1)
          }}
        />
      )}
    </div>
  )
}
