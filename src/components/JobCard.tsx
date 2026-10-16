import type { JobWithTecnicos } from '../types'
import { ESTADO_LABELS, PRE_INSTALACAO_LABELS, TIPO_SERVICO_LABELS } from '../types'
import { IconMapPin } from './icons'

const ESTADO_STYLES: Record<string, string> = {
  agendado: 'bg-warn-soft text-gold-deep',
  instalado: 'bg-success-soft text-success',
  nao_instalado: 'bg-danger-soft text-danger',
  cancelado: 'bg-line text-muted',
}

const PRE_INSTALACAO_STYLES: Record<string, string> = {
  tem: 'bg-success-soft text-success',
  nao_tem: 'bg-danger-soft text-danger',
  nao_se_sabe: 'bg-line text-muted',
}

export function JobCard({
  job,
  children,
}: {
  job: JobWithTecnicos
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">
            {job.hora_agendada && (
              <span className="mr-2 text-gold-deep">{job.hora_agendada.slice(0, 5)}</span>
            )}
            {job.cliente}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.endereco)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-sm text-gold-deep underline-offset-2 hover:underline"
          >
            <IconMapPin className="h-3.5 w-3.5 shrink-0" />
            {job.endereco}
          </a>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_STYLES[job.estado]}`}
        >
          {ESTADO_LABELS[job.estado]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
        <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-gold-deep">
          {TIPO_SERVICO_LABELS[job.tipo_servico]}
        </span>
        {job.tipo_servico === 'ar_condicionado' && job.tipo_ac && (
          <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-gold-deep">{job.tipo_ac}</span>
        )}
        {job.tipo_servico === 'ar_condicionado' && job.multi && (
          <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-gold-deep">
            Multi · {job.unidades_exteriores} ext.
          </span>
        )}
        {job.tipo_servico === 'ar_condicionado' && job.pre_instalacao && (
          <span
            className={`rounded-full px-2.5 py-0.5 ${PRE_INSTALACAO_STYLES[job.pre_instalacao]}`}
          >
            {PRE_INSTALACAO_LABELS[job.pre_instalacao]}
          </span>
        )}
        <span className="rounded-full bg-line px-2.5 py-0.5">
          Qtd: {job.quantidade}
        </span>
        {job.tecnicos.map((tecnico) => (
          <span key={tecnico.id} className="rounded-full bg-line px-2.5 py-0.5">
            {tecnico.nome}
          </span>
        ))}
      </div>

      {job.descricao && <p className="mt-2 text-sm text-muted">{job.descricao}</p>}
      {job.notas && <p className="mt-2 text-sm text-muted">{job.notas}</p>}
      {job.motivo_nao_instalado && (
        <p className="mt-2 text-sm text-danger">Motivo: {job.motivo_nao_instalado}</p>
      )}

      {job.foto_url && (
        <img
          src={job.foto_url}
          alt={`Foto da instalação para ${job.cliente}`}
          className="mt-3 h-40 w-full rounded-lg object-cover"
        />
      )}

      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
