import { useEffect, useRef, useState } from 'react'
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { pt } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { mapJobsWithTecnicos } from '../lib/jobTecnicos'
import { useAuth } from '../contexts/AuthContext'
import { CalendarView } from '../components/CalendarView'
import { JobCard } from '../components/JobCard'
import { MarkInstalledModal } from '../components/MarkInstalledModal'
import { MarkNotInstalledModal } from '../components/MarkNotInstalledModal'
import { clearPendingMarkInstalled, readPendingMarkInstalled } from '../lib/pendingAction'
import type { JobWithTecnicos } from '../types'

export function TechnicianCalendar() {
  const { profile } = useAuth()
  const [month, setMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date())
  const [jobs, setJobs] = useState<JobWithTecnicos[]>([])
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<JobWithTecnicos | null>(null)
  const [notInstalledJob, setNotInstalledJob] = useState<JobWithTecnicos | null>(null)
  const [resumedNotas, setResumedNotas] = useState<string | null>(null)
  const resumeCheckedRef = useRef(false)

  useEffect(() => {
    loadJobs()
  }, [month, profile])

  useEffect(() => {
    if (loading || resumeCheckedRef.current) return
    resumeCheckedRef.current = true

    const pending = readPendingMarkInstalled()
    if (!pending) return

    // setState adiado para fora do corpo síncrono do efeito.
    Promise.resolve().then(() => {
      const match = jobs.find((j) => j.id === pending.jobId && j.estado === 'agendado')
      if (match) {
        setResumedNotas(pending.notas)
        setActiveJob(match)
      } else {
        clearPendingMarkInstalled()
      }
    })
  }, [loading, jobs])

  async function loadJobs() {
    if (!profile) return
    setLoading(true)

    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })

    const { data, error } = await supabase
      .from('jobs')
      .select('*, job_tecnicos!inner(tecnico_id, tecnico:profiles(id, nome))')
      .eq('job_tecnicos.tecnico_id', profile.id)
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
            <h3 className="mb-3 text-sm font-bold capitalize text-ink">
              {format(selectedDay, "EEEE, d 'de' MMMM", { locale: pt })}
            </h3>

            {dayJobs.length === 0 ? (
              <p className="text-sm text-muted">Sem trabalhos agendados.</p>
            ) : (
              <div className="space-y-3">
                {dayJobs.map((job) => (
                  <JobCard key={job.id} job={job}>
                    {job.estado === 'agendado' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveJob(job)}
                          className="flex-1 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white transition hover:bg-success/90"
                        >
                          Marcar como instalado
                        </button>
                        <button
                          onClick={() => setNotInstalledJob(job)}
                          className="rounded-lg border border-danger/30 px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger-soft"
                        >
                          Não instalado
                        </button>
                      </div>
                    )}
                  </JobCard>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Seleciona um dia no calendário.</p>
        )}
      </div>

      {activeJob && (
        <MarkInstalledModal
          job={activeJob}
          initialNotas={resumedNotas ?? undefined}
          resumed={resumedNotas !== null}
          onClose={() => {
            setActiveJob(null)
            setResumedNotas(null)
          }}
          onSaved={() => {
            setActiveJob(null)
            setResumedNotas(null)
            loadJobs()
          }}
        />
      )}

      {notInstalledJob && (
        <MarkNotInstalledModal
          job={notInstalledJob}
          onClose={() => setNotInstalledJob(null)}
          onSaved={() => {
            setNotInstalledJob(null)
            loadJobs()
          }}
        />
      )}
    </div>
  )
}
