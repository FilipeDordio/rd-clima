export type Role = 'admin' | 'tecnico'

export type JobStatus = 'agendado' | 'instalado' | 'nao_instalado' | 'cancelado'

export type TipoServico =
  | 'ar_condicionado'
  | 'bomba_calor'
  | 'solar_termico'
  | 'hidraulica'
  | 'pre_instalacao'
  | 'manutencao'

export const TIPOS_SERVICO_APARELHO = ['ar_condicionado', 'bomba_calor', 'solar_termico'] as const
export type TipoServicoAparelho = (typeof TIPOS_SERVICO_APARELHO)[number]

export type PreInstalacao = 'tem' | 'nao_tem' | 'nao_se_sabe'

export type TipoOperacao = 'instalacao' | 'desinstalacao' | 'ambos'

export interface Profile {
  id: string
  nome: string
  role: Role
  telefone: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  morada: string
  localidade: string | null
  dimensoes: string | null
  tipo_operacao: TipoOperacao | null
  created_at: string
}

export interface Job {
  id: string
  cliente_id: string | null
  cliente: string
  endereco: string
  tipo_servico: TipoServico
  tipo_ac: string | null
  multi: boolean
  unidades_exteriores: number | null
  pre_instalacao: PreInstalacao | null
  descricao: string | null
  quantidade: number
  data_agendada: string
  hora_agendada: string | null
  estado: JobStatus
  notas: string | null
  foto_url: string | null
  motivo_nao_instalado: string | null
  proxima_manutencao: string | null
  proxima_manutencao_dia_certo: boolean
  aparelho_id: string | null
  created_at: string
  updated_at: string
}

export interface JobWithTecnicos extends Job {
  tecnicos: Pick<Profile, 'id' | 'nome'>[]
  cliente_contacto?: Pick<Cliente, 'telefone' | 'email'> | null
}

export interface Aparelho {
  id: string
  cliente_id: string | null
  cliente_nome: string
  job_instalacao_id: string | null
  tipo_servico: TipoServicoAparelho
  tipo_ac: string | null
  morada: string
  data_instalacao: string | null
  data_ultima_manutencao: string | null
  proxima_manutencao: string | null
  proxima_manutencao_dia_certo: boolean
  notas: string | null
  created_at: string
}

export interface AparelhoComCliente extends Aparelho {
  cliente_contacto?: Pick<Cliente, 'telefone' | 'email'> | null
}

export interface Ausencia {
  id: string
  tecnico_id: string
  data_inicio: string
  data_fim: string
  motivo: string | null
  created_at: string
}

export type JobHistoricoEvento = 'criado' | 'estado_alterado' | 'editado'

export interface JobHistoricoEntry {
  id: string
  job_id: string
  autor_id: string | null
  evento: JobHistoricoEvento
  estado_anterior: JobStatus | null
  estado_novo: JobStatus | null
  created_at: string
  autor: { nome: string } | null
}

export interface ModeloEquipamento {
  id: string
  tipo_servico: TipoServicoAparelho
  nome: string
  created_at: string
}

export const TIPOS_SERVICO: TipoServico[] = [
  'ar_condicionado',
  'bomba_calor',
  'solar_termico',
  'hidraulica',
  'pre_instalacao',
  'manutencao',
]

export const TIPO_SERVICO_LABELS: Record<TipoServico, string> = {
  ar_condicionado: 'Ar Condicionado',
  bomba_calor: 'Bomba de Calor',
  solar_termico: 'Solar Térmico',
  hidraulica: 'Instalação Hidráulica',
  pre_instalacao: 'Pré Instalação',
  manutencao: 'Manutenção',
}

export const PRE_INSTALACAO_OPTIONS: PreInstalacao[] = ['tem', 'nao_tem', 'nao_se_sabe']

export const PRE_INSTALACAO_LABELS: Record<PreInstalacao, string> = {
  tem: 'Tem pré instalação',
  nao_tem: 'Não tem',
  nao_se_sabe: 'Não se sabe',
}

export const ESTADO_LABELS: Record<JobStatus, string> = {
  agendado: 'Agendado',
  instalado: 'Instalado',
  nao_instalado: 'Não Instalado',
  cancelado: 'Cancelado',
}

export const TIPOS_OPERACAO: TipoOperacao[] = ['instalacao', 'desinstalacao', 'ambos']

export const TIPO_OPERACAO_LABELS: Record<TipoOperacao, string> = {
  instalacao: 'Instalação',
  desinstalacao: 'Desinstalação',
  ambos: 'Instalação e Desinstalação',
}
