import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { mapJobsWithTecnicos } from '../lib/jobTecnicos'
import { JobForm } from '../components/JobForm'
import { IconMapPin } from '../components/icons'
import {
  ESTADO_LABELS,
  TIPOS_SERVICO,
  TIPO_SERVICO_LABELS,
  type Cliente,
  type JobStatus,
  type JobWithTecnicos,
  type Profile,
  type TipoServico,
} from '../types'

const ESTADO_STYLES: Record<string, string> = {
  agendado: 'bg-warn-soft text-gold-deep',
  instalado: 'bg-success-soft text-success',
  nao_instalado: 'bg-danger-soft text-danger',
  cancelado: 'bg-line text-muted',
}

export function AdminServices() {
  const [jobs, setJobs] = useState<JobWithTecnicos[]>([])
  const [tecnicos, setTecnicos] = useState<Profile[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [editingJob, setEditingJob] = useState<JobWithTecnicos | null>(null)

  const [cliente, setCliente] = useState('')
  const [localidade, setLocalidade] = useState('')
  const [tipoServico, setTipoServico] = useState<TipoServico | ''>('')
  const [estado, setEstado] = useState<JobStatus | ''>('')
  const [tecnicoId, setTecnicoId] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
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

  useEffect(() => {
    const timeout = setTimeout(loadJobs, 300)
    return () => clearTimeout(timeout)
  }, [cliente, localidade, tipoServico, estado, tecnicoId, dataInicio, dataFim, sortOrder])

  async function loadJobs() {
    setLoading(true)

    const tecnicosSelect = tecnicoId
      ? 'job_tecnicos!inner(tecnico_id, tecnico:profiles(id, nome))'
      : 'job_tecnicos(tecnico:profiles(id, nome))'

    let query = supabase.from('jobs').select(`*, ${tecnicosSelect}`)

    if (cliente) query = query.ilike('cliente', `%${cliente}%`)
    if (localidade) query = query.ilike('endereco', `%${localidade}%`)
    if (tipoServico) query = query.eq('tipo_servico', tipoServico)
    if (estado) query = query.eq('estado', estado)
    if (tecnicoId) query = query.eq('job_tecnicos.tecnico_id', tecnicoId)
    if (dataInicio) query = query.gte('data_agendada', dataInicio)
    if (dataFim) query = query.lte('data_agendada', dataFim)

    const { data, error } = await query
      .order('data_agendada', { ascending: sortOrder === 'asc' })
      .order('hora_agendada', { ascending: sortOrder === 'asc', nullsFirst: false })

    if (!error) {
      setJobs(mapJobsWithTecnicos(data))
    }
    setLoading(false)
  }

  function limparFiltros() {
    setCliente('')
    setLocalidade('')
    setTipoServico('')
    setEstado('')
    setTecnicoId('')
    setDataInicio('')
    setDataFim('')
  }

  function exportarCSV() {
    const linhas = [
      ['Data', 'Hora', 'Cliente', 'Endereço', 'Tipo de serviço', 'Modelo', 'Técnicos', 'Estado'],
      ...jobs.map((j) => [
        j.data_agendada,
        j.hora_agendada?.slice(0, 5) ?? '',
        j.cliente,
        j.endereco,
        TIPO_SERVICO_LABELS[j.tipo_servico],
        j.tipo_ac ?? '',
        j.tecnicos.map((t) => t.nome).join(', '),
        ESTADO_LABELS[j.estado],
      ]),
    ]
    const csv = linhas
      .map((linha) => linha.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const BOM = String.fromCharCode(0xfeff)
    const blob = new Blob([BOM, csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    const tipoLabel = tipoServico ? `_${tipoServico}` : ''
    const estadoLabel = estado ? `_${estado}` : ''
    const dataLabel = dataInicio || dataFim ? `_${dataInicio || 'inicio'}_a_${dataFim || 'hoje'}` : ''
    a.download = `servicos${tipoLabel}${estadoLabel}${dataLabel}_${format(new Date(), 'yyyy-MM-dd')}.csv`

    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Cliente</label>
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Localização</label>
            <input
              value={localidade}
              onChange={(e) => setLocalidade(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tipo de serviço</label>
            <select
              value={tipoServico}
              onChange={(e) => setTipoServico(e.target.value as TipoServico | '')}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Todos</option>
              {TIPOS_SERVICO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_SERVICO_LABELS[tipo]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as JobStatus | '')}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Todos</option>
              {Object.entries(ESTADO_LABELS).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Técnico</label>
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Todos</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-2 text-xs text-muted">
          Para um dia específico, usa a mesma data em "De" e "Até".
        </p>

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setSortOrder((s) => (s === 'asc' ? 'desc' : 'asc'))}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper"
          >
            Data: {sortOrder === 'asc' ? 'mais antigos primeiro ↑' : 'mais recentes primeiro ↓'}
          </button>

          <button
            onClick={limparFiltros}
            className="text-xs font-medium text-gold-deep hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-paper">
            <tr className="text-left text-xs font-medium uppercase text-muted">
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Localização</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Técnico</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  A carregar...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  Sem resultados para os filtros escolhidos.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => setEditingJob(job)}
                  className="cursor-pointer hover:bg-paper"
                >
                  <td className="px-4 py-2">
                    {job.foto_url ? (
                      <img
                        src={job.foto_url}
                        alt={`Foto da instalação para ${job.cliente}`}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-paper" />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-ink">
                    {format(new Date(`${job.data_agendada}T00:00:00`), 'dd/MM/yyyy', { locale: pt })}
                    {job.hora_agendada && (
                      <span className="ml-1 text-gold-deep">{job.hora_agendada.slice(0, 5)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-ink">{job.cliente}</td>
                  <td className="px-4 py-2 text-muted">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.endereco)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-gold-deep hover:underline"
                    >
                      <IconMapPin className="h-3.5 w-3.5 shrink-0" />
                      {job.endereco}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {TIPO_SERVICO_LABELS[job.tipo_servico]}
                    {job.tipo_ac && <span className="text-muted"> · {job.tipo_ac}</span>}
                    {job.multi && (
                      <span className="text-muted"> · Multi ({job.unidades_exteriores}× ext.)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {job.tecnicos.length > 0
                      ? job.tecnicos.map((tecnico) => tecnico.nome).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_STYLES[job.estado]}`}
                    >
                      {ESTADO_LABELS[job.estado]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            {jobs.length} {jobs.length === 1 ? 'resultado' : 'resultados'}
          </p>
          <button
            onClick={exportarCSV}
            disabled={jobs.length === 0}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper disabled:opacity-50"
          >
            Exportar CSV
          </button>
        </div>
      )}

      {editingJob && (
        <JobForm
          data={editingJob.data_agendada}
          job={editingJob}
          tecnicos={tecnicos}
          clientes={clientes}
          onClose={() => setEditingJob(null)}
          onSaved={() => {
            setEditingJob(null)
            loadJobs()
          }}
        />
      )}
    </div>
  )
}
