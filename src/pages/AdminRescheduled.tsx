import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { mapJobsWithTecnicos } from '../lib/jobTecnicos'
import { JobCard } from '../components/JobCard'
import { JobForm } from '../components/JobForm'
import { NotifyClienteButtons } from '../components/NotifyClienteButtons'
import { TIPO_SERVICO_LABELS, type Cliente, type JobWithTecnicos, type Profile } from '../types'

function mensagemRemarcar(job: JobWithTecnicos) {
  return `Olá! Não foi possível concluir o serviço de ${TIPO_SERVICO_LABELS[job.tipo_servico]} em ${job.endereco} em ${format(new Date(`${job.data_agendada}T00:00:00`), 'dd/MM/yyyy')}. Vamos combinar uma nova data.`
}

export function AdminRescheduled() {
  const [jobs, setJobs] = useState<JobWithTecnicos[]>([])
  const [tecnicos, setTecnicos] = useState<Profile[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [reagendarJob, setReagendarJob] = useState<JobWithTecnicos | null>(null)

  useEffect(() => {
    loadJobs()

    supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'tecnico'])
      .order('nome')
      .then(({ data }) => setTecnicos((data as Profile[]) ?? []))

    supabase
      .from('clientes')
      .select('*')
      .order('nome')
      .then(({ data }) => setClientes((data as Cliente[]) ?? []))
  }, [])

  async function loadJobs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select('*, job_tecnicos(tecnico:profiles(id, nome)), cliente_contacto:clientes(telefone, email)')
      .eq('estado', 'nao_instalado')
      .order('data_agendada', { ascending: false })

    if (!error) setJobs(mapJobsWithTecnicos(data))
    setLoading(false)
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-base font-bold text-ink">Por remarcar</h2>
      <p className="mb-4 text-sm text-muted">
        Trabalhos que não foi possível instalar e ainda não têm nova data.
      </p>

      {loading ? (
        <p className="text-sm text-muted">A carregar...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-muted">Nada por remarcar de momento.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job}>
              <div className="space-y-2">
                <NotifyClienteButtons
                  telefone={job.cliente_contacto?.telefone}
                  email={job.cliente_contacto?.email}
                  assunto="RD Clima — vamos remarcar"
                  mensagem={mensagemRemarcar(job)}
                />
                <button
                  onClick={() => setReagendarJob(job)}
                  className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white"
                >
                  Remarcar
                </button>
              </div>
            </JobCard>
          ))}
        </div>
      )}

      {reagendarJob && (
        <JobForm
          job={reagendarJob}
          reagendar
          tecnicos={tecnicos}
          clientes={clientes}
          onClose={() => setReagendarJob(null)}
          onSaved={() => {
            setReagendarJob(null)
            loadJobs()
          }}
        />
      )}
    </div>
  )
}
