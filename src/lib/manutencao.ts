import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

/**
 * Combina um mês (input type="month", "YYYY-MM") com um dia opcional (1-31)
 * numa data para guardar na base de dados. Sem dia, usa o dia 1 como
 * marcador e devolve diaCerto=false, para a apresentação saber que só o mês
 * é conhecido.
 */
export function combinarMesDia(mes: string, dia: string): { data: string; diaCerto: boolean } | null {
  if (!mes) return null
  const diaCerto = dia.trim() !== ''
  const diaNum = diaCerto ? Math.min(31, Math.max(1, Number(dia))) : 1
  return { data: `${mes}-${String(diaNum).padStart(2, '0')}`, diaCerto }
}

/** Inverso de combinarMesDia, para pré-preencher o formulário ao editar. */
export function separarMesDia(data: string | null, diaCerto: boolean): { mes: string; dia: string } {
  if (!data) return { mes: '', dia: '' }
  const [ano, mes, dia] = data.split('-')
  return { mes: `${ano}-${mes}`, dia: diaCerto ? String(Number(dia)) : '' }
}

/** "12 de julho de 2027" se o dia for certo, ou só "julho de 2027". */
export function formatarProximaManutencao(data: string, diaCerto: boolean): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  const date = new Date(ano, mes - 1, dia)
  return diaCerto
    ? format(date, "d 'de' MMMM 'de' yyyy", { locale: pt })
    : format(date, "MMMM 'de' yyyy", { locale: pt })
}
