import type { JobWithTecnicos } from '../types'

export function mapJobsWithTecnicos(rows: any[] | null): JobWithTecnicos[] {
  return (rows ?? []).map((row) => {
    const { job_tecnicos, ...job } = row
    return {
      ...job,
      tecnicos: (job_tecnicos ?? []).flatMap((jt: any) => (jt.tecnico ? [jt.tecnico] : [])),
    } as JobWithTecnicos
  })
}
