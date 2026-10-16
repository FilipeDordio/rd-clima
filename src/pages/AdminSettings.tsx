import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  TIPOS_SERVICO_APARELHO,
  TIPO_SERVICO_LABELS,
  type ModeloEquipamento,
  type TipoServicoAparelho,
} from '../types'

const fieldClass =
  'w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold'

const EXEMPLO_MODELO: Record<TipoServicoAparelho, string> = {
  ar_condicionado: 'Haier Flexis Plus 12000 BTU',
  bomba_calor: 'Daikin Altherma 3',
  solar_termico: 'Vulcano Solar 200L',
}

export function AdminSettings() {
  const [modelos, setModelos] = useState<ModeloEquipamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModelos()
  }, [])

  async function loadModelos() {
    setLoading(true)
    const { data } = await supabase
      .from('modelos_equipamento')
      .select('*')
      .order('nome')
    setModelos((data as ModeloEquipamento[]) ?? [])
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-ink">Configurações</h2>
        <p className="text-sm text-muted">
          Gere os modelos de equipamento que aparecem para escolher ao criar um trabalho.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">A carregar...</p>
      ) : (
        TIPOS_SERVICO_APARELHO.map((tipo) => (
          <ModelosSection
            key={tipo}
            tipo={tipo}
            modelos={modelos.filter((m) => m.tipo_servico === tipo)}
            onChanged={loadModelos}
          />
        ))
      )}
    </div>
  )
}

function ModelosSection({
  tipo,
  modelos,
  onChanged,
}: {
  tipo: TipoServicoAparelho
  modelos: ModeloEquipamento[]
  onChanged: () => void
}) {
  const [novoNome, setNovoNome] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!novoNome.trim()) return
    setSaving(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('modelos_equipamento')
      .insert({ tipo_servico: tipo, nome: novoNome.trim() })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setNovoNome('')
    onChanged()
  }

  async function handleRemove(id: string) {
    if (!confirm('Remover este modelo da lista?')) return
    await supabase.from('modelos_equipamento').delete().eq('id', id)
    onChanged()
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-ink">{TIPO_SERVICO_LABELS[tipo]}</h3>

      {modelos.length === 0 ? (
        <p className="mb-3 text-sm text-muted">Ainda não há modelos registados.</p>
      ) : (
        <ul className="mb-3 space-y-1.5">
          {modelos.map((modelo) => (
            <li
              key={modelo.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-gold-deep"
            >
              {modelo.nome}
              <button
                type="button"
                onClick={() => handleRemove(modelo.id)}
                className="shrink-0 text-xs font-medium text-danger hover:underline"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder={`Ex: ${EXEMPLO_MODELO[tipo]}`}
          className={fieldClass}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !novoNome.trim()}
          className="shrink-0 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
