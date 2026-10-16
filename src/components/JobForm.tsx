import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { notifyUsers } from '../lib/sendPushNotification'
import { initials } from '../lib/initials'
import { combinarMesDia, separarMesDia } from '../lib/manutencao'
import { Chip } from './Chip'
import {
  ESTADO_LABELS,
  PRE_INSTALACAO_LABELS,
  PRE_INSTALACAO_OPTIONS,
  TIPOS_SERVICO,
  TIPOS_SERVICO_APARELHO,
  TIPO_SERVICO_LABELS,
  type Aparelho,
  type Cliente,
  type Job,
  type JobHistoricoEntry,
  type JobWithTecnicos,
  type ModeloEquipamento,
  type PreInstalacao,
  type Profile,
  type TipoServico,
  type TipoServicoAparelho,
} from '../types'

const EVENTO_LABELS: Record<string, string> = {
  criado: 'Trabalho criado',
  estado_alterado: 'Estado alterado',
  editado: 'Trabalho editado',
}

interface JobFormInitial {
  cliente_id?: string | null
  cliente?: string
  endereco?: string
  tipo_servico?: TipoServico
  aparelho_id?: string | null
}

interface JobFormProps {
  data?: string
  job?: (Job & Partial<Pick<JobWithTecnicos, 'tecnicos'>>) | null
  initial?: JobFormInitial
  /** Ao guardar, volta a marcar o trabalho como "agendado" — usada em "Por remarcar". */
  reagendar?: boolean
  tecnicos: Profile[]
  clientes: Cliente[]
  onClose: () => void
  onSaved: () => void
}

function clienteLabel(cliente: Cliente) {
  return cliente.localidade ? `${cliente.nome} — ${cliente.localidade}` : cliente.nome
}

function ehTipoAparelho(tipo: TipoServico): tipo is TipoServicoAparelho {
  return (TIPOS_SERVICO_APARELHO as readonly string[]).includes(tipo)
}

const fieldClass =
  'w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold'
const labelClass = 'mb-1 block text-sm font-medium text-ink'

export function JobForm({
  data,
  job,
  initial,
  reagendar,
  tecnicos,
  clientes,
  onClose,
  onSaved,
}: JobFormProps) {
  const jobCliente = job?.cliente_id ? clientes.find((c) => c.id === job.cliente_id) ?? null : null
  const prefilledCliente =
    !job && initial?.cliente_id ? clientes.find((c) => c.id === initial.cliente_id) ?? null : null
  const initialCliente = jobCliente ?? prefilledCliente

  const [dataAgendada, setDataAgendada] = useState(
    data ?? job?.data_agendada ?? format(new Date(), 'yyyy-MM-dd'),
  )

  const [clienteRegistado, setClienteRegistado] = useState(Boolean(initialCliente))
  const [clienteId, setClienteId] = useState(initialCliente?.id ?? '')
  const [clienteQuery, setClienteQuery] = useState(initialCliente ? clienteLabel(initialCliente) : '')
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)

  const [cliente, setCliente] = useState(job?.cliente ?? initial?.cliente ?? initialCliente?.nome ?? '')
  const [endereco, setEndereco] = useState(
    job?.endereco ?? initial?.endereco ?? initialCliente?.morada ?? '',
  )
  const [tipoServico, setTipoServico] = useState<TipoServico>(
    job?.tipo_servico ?? initial?.tipo_servico ?? 'ar_condicionado',
  )
  const [aparelhoId, setAparelhoId] = useState(job?.aparelho_id ?? initial?.aparelho_id ?? '')
  const [modelo, setModelo] = useState(job?.tipo_ac ?? '')
  const [multi, setMulti] = useState(job?.multi ?? false)
  const [unidadesExteriores, setUnidadesExteriores] = useState(job?.unidades_exteriores ?? 2)
  const [preInstalacao, setPreInstalacao] = useState<PreInstalacao | ''>(job?.pre_instalacao ?? '')
  const [descricao, setDescricao] = useState(job?.descricao ?? '')
  const [quantidade, setQuantidade] = useState(job?.quantidade ?? 1)
  const [horaAgendada, setHoraAgendada] = useState(job?.hora_agendada?.slice(0, 5) ?? '')
  const [tecnicoIds, setTecnicoIds] = useState<string[]>(
    job?.tecnicos?.map((tecnico) => tecnico.id) ?? [],
  )
  const initialManutencao = separarMesDia(
    job?.proxima_manutencao ?? null,
    job?.proxima_manutencao_dia_certo ?? false,
  )
  const [manutencaoMes, setManutencaoMes] = useState(initialManutencao.mes)
  const [manutencaoDia, setManutencaoDia] = useState(initialManutencao.dia)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tecnicosAusentes, setTecnicosAusentes] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase
      .from('ausencias')
      .select('tecnico_id')
      .lte('data_inicio', dataAgendada)
      .gte('data_fim', dataAgendada)
      .then(({ data: rows }) => setTecnicosAusentes(new Set((rows ?? []).map((r) => r.tecnico_id))))
  }, [dataAgendada])

  const [aparelhosPorCliente, setAparelhosPorCliente] = useState<Aparelho[]>([])

  useEffect(() => {
    if (tipoServico !== 'manutencao' || !clienteId) return
    supabase
      .from('aparelhos')
      .select('*')
      .eq('cliente_id', clienteId)
      .then(({ data: rows }) => setAparelhosPorCliente((rows as Aparelho[]) ?? []))
  }, [tipoServico, clienteId])

  const aparelhosCliente = tipoServico === 'manutencao' && clienteId ? aparelhosPorCliente : []

  const [modelosEquipamento, setModelosEquipamento] = useState<ModeloEquipamento[]>([])

  useEffect(() => {
    if (!ehTipoAparelho(tipoServico)) return
    supabase
      .from('modelos_equipamento')
      .select('*')
      .eq('tipo_servico', tipoServico)
      .order('nome')
      .then(({ data: rows }) => setModelosEquipamento((rows as ModeloEquipamento[]) ?? []))
  }, [tipoServico])

  const modelosCatalogo = ehTipoAparelho(tipoServico) ? modelosEquipamento : []

  const [historico, setHistorico] = useState<JobHistoricoEntry[]>([])

  useEffect(() => {
    if (!job) return
    supabase
      .from('job_historico')
      .select('*, autor:profiles(nome)')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
      .then(({ data: rows }) => setHistorico((rows as JobHistoricoEntry[]) ?? []))
  }, [job])

  const filteredClientes = (() => {
    const query = clienteQuery.trim().toLowerCase()
    const lista = query
      ? clientes.filter(
          (c) =>
            c.nome.toLowerCase().includes(query) || (c.localidade ?? '').toLowerCase().includes(query),
        )
      : clientes
    return lista.slice(0, 8)
  })()

  function toggleTecnico(id: string) {
    setTecnicoIds((current) =>
      current.includes(id) ? current.filter((tecnicoId) => tecnicoId !== id) : [...current, id],
    )
  }

  function selectCliente(c: Cliente) {
    setClienteId(c.id)
    setClienteQuery(clienteLabel(c))
    setShowClienteDropdown(false)
    setCliente(c.nome)
    setEndereco(c.morada)
    if (c.dimensoes) setModelo(c.dimensoes)
  }

  function handleClienteRegistadoChange(registado: boolean) {
    setClienteRegistado(registado)
    if (!registado) {
      setClienteId('')
      setClienteQuery('')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const isAc = tipoServico === 'ar_condicionado'
    const isAparelho = ehTipoAparelho(tipoServico)
    const manutencao = isAparelho ? combinarMesDia(manutencaoMes, manutencaoDia) : null

    const payload = {
      cliente_id: clienteRegistado && clienteId ? clienteId : null,
      cliente,
      endereco,
      tipo_servico: tipoServico,
      tipo_ac: isAparelho ? modelo || null : null,
      multi: isAc ? multi : false,
      unidades_exteriores: isAc && multi ? unidadesExteriores : null,
      pre_instalacao: isAc ? preInstalacao || null : null,
      descricao: isAc ? null : descricao,
      quantidade,
      data_agendada: dataAgendada,
      hora_agendada: horaAgendada || null,
      proxima_manutencao: manutencao?.data ?? null,
      proxima_manutencao_dia_certo: manutencao?.diaCerto ?? false,
      aparelho_id: tipoServico === 'manutencao' ? aparelhoId || null : null,
      ...(reagendar ? { estado: 'agendado' as const, motivo_nao_instalado: null } : {}),
    }

    const { data: savedJob, error: saveError } = job
      ? await supabase.from('jobs').update(payload).eq('id', job.id).select('id').single()
      : await supabase.from('jobs').insert(payload).select('id').single()

    if (saveError || !savedJob) {
      setSaving(false)
      setError(saveError?.message ?? 'Erro ao guardar o trabalho.')
      return
    }

    const { error: deleteError } = await supabase
      .from('job_tecnicos')
      .delete()
      .eq('job_id', savedJob.id)

    if (deleteError) {
      setSaving(false)
      setError(deleteError.message)
      return
    }

    if (tecnicoIds.length > 0) {
      const { error: insertError } = await supabase
        .from('job_tecnicos')
        .insert(tecnicoIds.map((tecnicoId) => ({ job_id: savedJob.id, tecnico_id: tecnicoId })))

      if (insertError) {
        setSaving(false)
        setError(insertError.message)
        return
      }

      notifyUsers(tecnicoIds, {
        title: job ? 'Trabalho atualizado' : 'Novo trabalho agendado',
        body: `${cliente} — ${TIPO_SERVICO_LABELS[tipoServico]}, ${dataAgendada}${horaAgendada ? ` às ${horaAgendada}` : ''}`,
        url: '/',
      })
    }

    setSaving(false)
    onSaved()
  }

  async function handleDelete() {
    if (!job) return
    if (!confirm('Eliminar este trabalho?')) return

    setSaving(true)
    const { error } = await supabase.from('jobs').delete().eq('id', job.id)
    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white sm:items-center sm:justify-center sm:bg-black/40 sm:p-4">
      <div className="flex h-full w-full flex-col sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:overflow-hidden sm:rounded-xl sm:shadow-lg">
        <div className="flex items-center gap-2 bg-ink px-4 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-paper/70 transition hover:text-paper"
          >
            Cancelar
          </button>
          <h2 className="flex-1 text-center text-sm font-bold text-paper">
            {reagendar ? 'Remarcar trabalho' : job ? 'Editar trabalho' : 'Novo trabalho'}
            {data && <span className="block text-xs font-medium text-paper/50">{data}</span>}
          </h2>
          <span className="w-[52px]" />
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            {!data && (
              <div>
                <label className={labelClass}>Data</label>
                <input
                  type="date"
                  required
                  value={dataAgendada}
                  onChange={(e) => setDataAgendada(e.target.value)}
                  className={fieldClass}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Cliente registado?</label>
              <div className="flex gap-2">
                <Chip selected={clienteRegistado} onClick={() => handleClienteRegistadoChange(true)}>
                  Sim
                </Chip>
                <Chip selected={!clienteRegistado} onClick={() => handleClienteRegistadoChange(false)}>
                  Não
                </Chip>
              </div>
            </div>

            {clienteRegistado && (
              <div className="relative">
                <label className={labelClass}>Pesquisar cliente</label>
                <input
                  value={clienteQuery}
                  onChange={(e) => {
                    setClienteQuery(e.target.value)
                    setClienteId('')
                    setShowClienteDropdown(true)
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClienteDropdown(false), 100)}
                  placeholder="Nome ou localidade..."
                  className={fieldClass}
                />
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
                {clientes.length === 0 && (
                  <p className="mt-1 text-xs text-muted">Ainda não há clientes registados.</p>
                )}
              </div>
            )}

            <div>
              <label className={labelClass}>Cliente</label>
              <input
                required
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Localização</label>
              <input
                required
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Tipo de serviço</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {TIPOS_SERVICO.map((tipo) => (
                  <Chip key={tipo} selected={tipoServico === tipo} onClick={() => setTipoServico(tipo)}>
                    {TIPO_SERVICO_LABELS[tipo]}
                  </Chip>
                ))}
              </div>
            </div>

            {tipoServico === 'manutencao' ? (
              <>
                <div>
                  <label className={labelClass}>Qual aparelho?</label>
                  {!clienteRegistado || !clienteId ? (
                    <p className="text-sm text-muted">
                      Seleciona um cliente registado para ver os aparelhos dele.
                    </p>
                  ) : aparelhosCliente.length === 0 ? (
                    <p className="text-sm text-muted">Este cliente ainda não tem aparelhos registados.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {aparelhosCliente.map((aparelho) => (
                        <Chip
                          key={aparelho.id}
                          selected={aparelhoId === aparelho.id}
                          onClick={() => {
                            setAparelhoId(aparelho.id)
                            setEndereco(aparelho.morada)
                          }}
                        >
                          {TIPO_SERVICO_LABELS[aparelho.tipo_servico]}
                          {aparelho.tipo_ac ? ` · ${aparelho.tipo_ac}` : ''} — {aparelho.morada}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Notas</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={2}
                    className={fieldClass}
                    placeholder="Ex: limpeza de filtros, verificação de gás..."
                  />
                </div>
              </>
            ) : ehTipoAparelho(tipoServico) ? (
              <>
                <div>
                  <label className={labelClass}>Modelo</label>
                  <div className="flex flex-wrap gap-2 pb-1">
                    {modelo && !modelosCatalogo.some((m) => m.nome === modelo) && (
                      <span className="shrink-0 rounded-full border border-gold bg-gold px-3.5 py-1.5 text-sm font-medium text-ink">
                        {modelo} (valor atual)
                      </span>
                    )}
                    {modelosCatalogo.map((m) => (
                      <Chip key={m.id} selected={modelo === m.nome} onClick={() => setModelo(m.nome)}>
                        {m.nome}
                      </Chip>
                    ))}
                  </div>
                  {modelosCatalogo.length === 0 && !modelo && (
                    <p className="mt-1 text-xs text-muted">
                      Ainda não há modelos configurados para {TIPO_SERVICO_LABELS[tipoServico].toLowerCase()}.
                      Podes adicionar em Configurações.
                    </p>
                  )}
                </div>

                {tipoServico === 'ar_condicionado' && (
                  <>
                    <div>
                      <Chip selected={multi} onClick={() => setMulti((m) => !m)}>
                        Multi
                      </Chip>
                      {multi && (
                        <div className="mt-3">
                          <label className={labelClass}>Quantas unidades exteriores?</label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setUnidadesExteriores((n) => Math.max(2, n - 1))}
                              className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-xl font-semibold text-ink transition active:bg-paper"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-lg font-semibold text-ink">
                              {unidadesExteriores}
                            </span>
                            <button
                              type="button"
                              onClick={() => setUnidadesExteriores((n) => n + 1)}
                              className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-xl font-semibold text-ink transition active:bg-paper"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Pré instalação</label>
                      <div className="flex flex-wrap gap-2">
                        {PRE_INSTALACAO_OPTIONS.map((opcao) => (
                          <Chip
                            key={opcao}
                            selected={preInstalacao === opcao}
                            onClick={() => setPreInstalacao(opcao)}
                          >
                            {PRE_INSTALACAO_LABELS[opcao]}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {tipoServico !== 'ar_condicionado' && (
                  <div>
                    <label className={labelClass}>Descrição do trabalho</label>
                    <textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      rows={2}
                      className={fieldClass}
                      placeholder="Ex: instalação de bomba de calor 12kW..."
                    />
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className={labelClass}>Descrição do trabalho</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                  className={fieldClass}
                  placeholder="Ex: instalação hidráulica..."
                />
              </div>
            )}

            {ehTipoAparelho(tipoServico) && (
              <div>
                <label className={labelClass}>Agendar manutenção para (opcional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="month"
                    value={manutencaoMes}
                    onChange={(e) => setManutencaoMes(e.target.value)}
                    className={fieldClass}
                  />
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="Dia (opcional)"
                    value={manutencaoDia}
                    onChange={(e) => setManutencaoDia(e.target.value)}
                    disabled={!manutencaoMes}
                    className={`${fieldClass} disabled:opacity-50`}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  Sem dia certo, fica só o mês — útil quando ainda falta muito tempo.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Hora</label>
                <input
                  type="time"
                  value={horaAgendada}
                  onChange={(e) => setHoraAgendada(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>Quantidade</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Técnicos</label>
              {tecnicos.length === 0 ? (
                <p className="text-sm text-muted">Ainda não há técnicos registados.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tecnicos.map((tecnico) => {
                    const selected = tecnicoIds.includes(tecnico.id)
                    const ausente = tecnicosAusentes.has(tecnico.id)
                    return (
                      <button
                        key={tecnico.id}
                        type="button"
                        onClick={() => toggleTecnico(tecnico.id)}
                        className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm font-medium transition ${
                          selected
                            ? 'border-gold bg-warn-soft text-gold-deep'
                            : 'border-line bg-white text-ink hover:bg-paper'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            selected ? 'bg-gold text-ink' : 'bg-warn-soft text-gold-deep'
                          }`}
                        >
                          {initials(tecnico.nome)}
                        </span>
                        {tecnico.nome}
                        {ausente && <span className="text-[10px] font-bold text-danger">· ausente</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {job?.foto_url && (
              <div className="border-t border-line pt-4">
                <label className={labelClass}>Foto da instalação</label>
                <a href={job.foto_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={job.foto_url}
                    alt={`Foto da instalação para ${job.cliente}`}
                    className="h-56 w-full rounded-lg object-cover"
                  />
                </a>
              </div>
            )}

            {job && historico.length > 0 && (
              <div className="border-t border-line pt-4">
                <label className={labelClass}>Histórico</label>
                <ul className="space-y-2">
                  {historico.map((entry) => (
                    <li key={entry.id} className="text-sm text-ink">
                      <p>
                        {EVENTO_LABELS[entry.evento] ?? entry.evento}
                        {entry.evento === 'estado_alterado' &&
                          entry.estado_anterior &&
                          entry.estado_novo && (
                            <span className="text-muted">
                              {' '}
                              · {ESTADO_LABELS[entry.estado_anterior]} → {ESTADO_LABELS[entry.estado_novo]}
                            </span>
                          )}
                      </p>
                      <p className="text-xs text-muted">
                        {format(new Date(entry.created_at), "d 'de' MMM, HH:mm", { locale: pt })}
                        {entry.autor?.nome && ` · ${entry.autor.nome}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line bg-white px-4 py-3">
            {job ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger-soft disabled:opacity-60"
              >
                Eliminar
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white disabled:opacity-60 sm:flex-none"
            >
              {saving ? 'A guardar...' : reagendar ? 'Remarcar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
