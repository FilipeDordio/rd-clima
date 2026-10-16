import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { mapJobsWithTecnicos } from '../lib/jobTecnicos'
import { useAuth } from '../contexts/AuthContext'
import { JobCard } from '../components/JobCard'
import { MarkInstalledModal } from '../components/MarkInstalledModal'
import { MarkNotInstalledModal } from '../components/MarkNotInstalledModal'
import { NotifyClienteButtons } from '../components/NotifyClienteButtons'
import { clearPendingMarkInstalled, readPendingMarkInstalled } from '../lib/pendingAction'
import { TIPO_SERVICO_LABELS, type JobWithTecnicos } from '../types'

function mensagemACaminho(job: JobWithTecnicos) {
  return `Olá! A equipa RD Clima está a caminho para o serviço de ${TIPO_SERVICO_LABELS[job.tipo_servico]} em ${job.endereco}. Até já!`
}

function mensagemConcluido(job: JobWithTecnicos) {
  return `Olá! O serviço de ${TIPO_SERVICO_LABELS[job.tipo_servico]} em ${job.endereco} foi concluído. Obrigado por confiar na RD Clima!`
}

export function Today() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState<JobWithTecnicos[]>([])
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<JobWithTecnicos | null>(null)
  const [notInstalledJob, setNotInstalledJob] = useState<JobWithTecnicos | null>(null)
  const [resumedNotas, setResumedNotas] = useState<string | null>(null)
  const resumeCheckedRef = useRef(false)

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  useEffect(() => {
    loadJobs()
  }, [profile])

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

    const isTecnico = profile.role === 'tecnico'
    const tecnicosSelect = isTecnico
      ? 'job_tecnicos!inner(tecnico_id, tecnico:profiles(id, nome))'
      : 'job_tecnicos(tecnico:profiles(id, nome))'

    let query = supabase
      .from('jobs')
      .select(`*, ${tecnicosSelect}, cliente_contacto:clientes(telefone, email)`)
      .eq('data_agendada', todayStr)

    if (isTecnico) {
      query = query.eq('job_tecnicos.tecnico_id', profile.id)
    }

    const { data, error } = await query

    if (!error) {
      const result = mapJobsWithTecnicos(data)
      result.sort((a, b) => (a.hora_agendada ?? '99:99').localeCompare(b.hora_agendada ?? '99:99'))
      setJobs(result)
    }
    setLoading(false)
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-base font-bold capitalize text-ink">
        {format(today, "EEEE, d 'de' MMMM", { locale: pt })}
      </h2>
      <p className="mb-4 text-sm text-muted">Trabalhos de hoje</p>

      {loading ? (
        <p className="text-sm text-muted">A carregar...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-muted">Sem trabalhos agendados para hoje.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job}>
              <div className="space-y-2">
                {job.estado === 'agendado' && (
                  <>
                    <NotifyClienteButtons
                      telefone={job.cliente_contacto?.telefone}
                      email={job.cliente_contacto?.email}
                      assunto="RD Clima — estamos a caminho"
                      mensagem={mensagemACaminho(job)}
                    />
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
                  </>
                )}
                {job.estado === 'instalado' && (
                  <NotifyClienteButtons
                    telefone={job.cliente_contacto?.telefone}
                    email={job.cliente_contacto?.email}
                    assunto="RD Clima — serviço concluído"
                    mensagem={mensagemConcluido(job)}
                  />
                )}
              </div>
            </JobCard>
          ))}
        </div>
      )}

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
