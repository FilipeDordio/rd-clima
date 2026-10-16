import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ProximasManutencoes } from '../components/ProximasManutencoes'
import type { Cliente, Profile } from '../types'

export function AdminMaintenance() {
  const [tecnicos, setTecnicos] = useState<Profile[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

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

  return <ProximasManutencoes tecnicos={tecnicos} clientes={clientes} variant="page" />
}
