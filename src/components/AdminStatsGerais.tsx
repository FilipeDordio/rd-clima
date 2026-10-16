import { useEffect, useState } from 'react'
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns'
import { supabase } from '../lib/supabase'
import { mapJobsWithTecnicos } from '../lib/jobTecnicos'
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

type Periodo = '7d' | '15d' | '1m' | '3m' | '6m' | '1a' | 'todos' | 'personalizado'

const PERIODO_OPTIONS: { value: Periodo; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: '7d', label: 'Última semana' },
  { value: '15d', label: 'Últimos 15 dias' },
  { value: '1m', label: 'Último mês' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1a', label: 'Último ano' },
  { value: 'personalizado', label: 'Personalizado (de/até)' },
]

function periodoCutoff(periodo: Periodo, hoje: Date): Date | null {
  switch (periodo) {
    case '7d':
      return subDays(hoje, 7)
    case '15d':
      return subDays(hoje, 15)
    case '1m':
      return subMonths(hoje, 1)
    case '3m':
      return subMonths(hoje, 3)
    case '6m':
      return subMonths(hoje, 6)
    case '1a':
      return subYears(hoje, 1)
    case 'todos':
    case 'personalizado':
      return null
  }
}

function clienteLabel(cliente: Cliente) {
  return cliente.localidade ? `${cliente.nome} — ${cliente.localidade}` : cliente.nome
}

function countInstalado(jobs: JobWithTecnicos[], start: Date, end: Date) {
  const s = format(start, 'yyyy-MM-dd')
  const e = format(end, 'yyyy-MM-dd')
  return jobs.filter((j) => j.estado === 'instalado' && j.data_agendada >= s && j.data_agendada <= e)
    .length
}

function variacao(atual: number, anterior: number) {
  const diff = atual - anterior
  if (diff === 0) return 'igual ao período anterior'
  return diff > 0 ? `+${diff} vs período anterior` : `${diff} vs período anterior`
}

export function AdminStatsGerais() {
  const [tecnicos, setTecnicos] = useState<Profile[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [jobs, setJobs] = useState<JobWithTecnicos[]>([])
  const [loading, setLoading] = useState(true)

  const [tecnicoId, setTecnicoId] = useState('')
  const [tipoServico, setTipoServico] = useState<TipoServico | ''>('')
  const [estado, setEstado] = useState<JobStatus | ''>('')
  const [clienteId, setClienteId] = useState('')
  const [clienteQuery, setClienteQuery] = useState('')
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [periodo, setPeriodo] = useState<Periodo>('todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

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
    loadJobs()
  }, [tecnicoId, tipoServico, estado, clienteId])

  async function loadJobs() {
    setLoading(true)

    const selectTecnicos = tecnicoId
      ? 'job_tecnicos!inner(tecnico_id, tecnico:profiles(id, nome))'
      : 'job_tecnicos(tecnico:profiles(id, nome))'

    let query = supabase.from('jobs').select(`*, ${selectTecnicos}`)
    if (tecnicoId) query = query.eq('job_tecnicos.tecnico_id', tecnicoId)
    if (tipoServico) query = query.eq('tipo_servico', tipoServico)
    if (estado) query = query.eq('estado', estado)
    if (clienteId) query = query.eq('cliente_id', clienteId)
    query = query.order('data_agendada', { ascending: false })

    const { data, error } = await query
    if (!error) setJobs(mapJobsWithTecnicos(data))
    setLoading(false)
  }

  const filteredClientes = (() => {
    const q = clienteQuery.trim().toLowerCase()
    const lista = q
      ? clientes.filter(
          (c) => c.nome.toLowerCase().includes(q) || (c.localidade ?? '').toLowerCase().includes(q),
        )
      : clientes
    return lista.slice(0, 8)
  })()

  function selectCliente(c: Cliente) {
    setClienteId(c.id)
    setClienteQuery(clienteLabel(c))
    setShowClienteDropdown(false)
  }

  function limparCliente() {
    setClienteId('')
    setClienteQuery('')
  }

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const prevWeekStart = subWeeks(weekStart, 1)
  const prevWeekEnd = subWeeks(weekEnd, 1)
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const prevMonthStart = startOfMonth(subMonths(today, 1))
  const prevMonthEnd = endOfMonth(subMonths(today, 1))

  const semana = countInstalado(jobs, weekStart, weekEnd)
  const semanaAnt = countInstalado(jobs, prevWeekStart, prevWeekEnd)
  const mes = countInstalado(jobs, monthStart, monthEnd)
  const mesAnt = countInstalado(jobs, prevMonthStart, prevMonthEnd)

  const historico =
    periodo === 'personalizado'
      ? jobs.filter(
          (j) => (!dataInicio || j.data_agendada >= dataInicio) && (!dataFim || j.data_agendada <= dataFim),
        )
      : (() => {
          const cutoff = periodoCutoff(periodo, today)
          return cutoff ? jobs.filter((j) => j.data_agendada >= format(cutoff, 'yyyy-MM-dd')) : jobs
        })()
  const totalPeriodo = historico.filter((j) => j.estado === 'instalado').length

  const cards = [
    { label: 'Esta semana', value: semana, hint: variacao(semana, semanaAnt) },
    { label: 'Este mês', value: mes, hint: variacao(mes, mesAnt) },
    {
      label: 'Total instalados',
      value: totalPeriodo,
      hint: periodo === 'todos' ? 'em todo o histórico' : 'no período selecionado',
    },
  ]

  const porTipo = TIPOS_SERVICO.map((tipo) => ({
    label: TIPO_SERVICO_LABELS[tipo],
    count: historico.filter((j) => j.tipo_servico === tipo).length,
  })).filter((t) => t.count > 0)

  const porTecnico = (() => {
    const counts = new Map<string, number>()
    for (const j of historico) {
      for (const t of j.tecnicos) {
        counts.set(t.nome, (counts.get(t.nome) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count)
  })()

  const porEstado = (Object.keys(ESTADO_LABELS) as JobStatus[])
    .map((e) => ({ label: ESTADO_LABELS[e], count: historico.filter((j) => j.estado === e).length }))
    .filter((e) => e.count > 0)

  function exportarCSV() {
    const linhas = [
      ['Data', 'Hora', 'Cliente', 'Endereço', 'Tipo de serviço', 'Modelo', 'Técnicos', 'Estado'],
      ...historico.map((j) => [
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

    const periodoLabel =
      periodo === 'personalizado' ? `${dataInicio || 'inicio'}_a_${dataFim || 'hoje'}` : periodo
    const tipoLabel = tipoServico ? `_${tipoServico}` : ''
    const estadoLabel = estado ? `_${estado}` : ''
    a.download = `servicos_${periodoLabel}${tipoLabel}${estadoLabel}.csv`

    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-ink">Filtros</h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Período</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {PERIODO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {periodo === 'personalizado' && (
            <>
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
            </>
          )}

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

          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-ink">Cliente</label>
            <div className="flex gap-1">
              <input
                value={clienteQuery}
                onChange={(e) => {
                  setClienteQuery(e.target.value)
                  setClienteId('')
                  setShowClienteDropdown(true)
                }}
                onFocus={() => setShowClienteDropdown(true)}
                onBlur={() => setTimeout(() => setShowClienteDropdown(false), 100)}
                placeholder="Todos"
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
              {clienteId && (
                <button
                  type="button"
                  onClick={limparCliente}
                  className="rounded-lg border border-line px-2 text-sm text-muted hover:bg-paper"
                >
                  ×
                </button>
              )}
            </div>
            {showClienteDropdown && filteredClientes.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg">
                {filteredClientes.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={() => selectCliente(c)}
                      className="w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-warn-soft"
                    >
                      {clienteLabel(c)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {periodo === 'personalizado' && (
          <p className="mt-2 text-xs text-muted">
            Para um dia específico, usa a mesma data em "De" e "Até".
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-line bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{card.value}</p>
            <p className="text-xs text-muted">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-ink">Por tipo de serviço</h3>
          {porTipo.length === 0 ? (
            <p className="text-sm text-muted">Sem dados no período.</p>
          ) : (
            <ul className="space-y-1.5">
              {porTipo.map((t) => (
                <li key={t.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t.label}</span>
                  <span className="font-semibold text-ink">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-ink">Por técnico</h3>
          {porTecnico.length === 0 ? (
            <p className="text-sm text-muted">Sem dados no período.</p>
          ) : (
            <ul className="space-y-1.5">
              {porTecnico.map((t) => (
                <li key={t.nome} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t.nome}</span>
                  <span className="font-semibold text-ink">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-ink">Por estado</h3>
          {porEstado.length === 0 ? (
            <p className="text-sm text-muted">Sem dados no período.</p>
          ) : (
            <ul className="space-y-1.5">
              {porEstado.map((e) => (
                <li key={e.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{e.label}</span>
                  <span className="font-semibold text-ink">{e.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Histórico</h2>
          <button
            onClick={exportarCSV}
            disabled={historico.length === 0}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper disabled:opacity-50"
          >
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-paper">
              <tr className="text-left text-xs font-medium uppercase text-muted">
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Modelo</th>
                <th className="px-3 py-2">Técnicos</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted">
                    A carregar...
                  </td>
                </tr>
              ) : historico.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted">
                    Sem resultados para os filtros escolhidos.
                  </td>
                </tr>
              ) : (
                historico.map((job) => (
                  <tr key={job.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-ink">
                      {format(new Date(`${job.data_agendada}T00:00:00`), 'dd/MM/yyyy')}
                      {job.hora_agendada && (
                        <span className="ml-1 text-gold-deep">{job.hora_agendada.slice(0, 5)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium text-ink">{job.cliente}</td>
                    <td className="px-3 py-2 text-muted">{TIPO_SERVICO_LABELS[job.tipo_servico]}</td>
                    <td className="px-3 py-2 text-muted">{job.tipo_ac ?? '—'}</td>
                    <td className="px-3 py-2 text-muted">
                      {job.tecnicos.length > 0
                        ? job.tecnicos.map((tecnico) => tecnico.nome).join(', ')
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-muted">{ESTADO_LABELS[job.estado]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
