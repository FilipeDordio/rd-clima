import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { session, profile, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError('Email ou palavra-passe inválidos.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 pb-24 pt-16 sm:pb-16">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 pt-0 shadow-xl">
        <img
          src="/logo.png"
          alt="RD Clima"
          className="mx-auto -mt-10 mb-3 h-20 w-20 rounded-full border-4 border-white shadow-lg"
        />
        <h1 className="mb-1 text-center text-xl font-bold text-ink">RD Clima</h1>
        <p className="mb-6 text-center text-sm text-muted">Inicia sessão para continuar</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
              Palavra-passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-gold-deep hover:text-white disabled:opacity-60"
          >
            {submitting ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
