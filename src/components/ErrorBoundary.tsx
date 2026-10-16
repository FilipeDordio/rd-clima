import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Rede de segurança: se algo rebentar a meio do render (ex: um pedaço da
 * app falhar a carregar em ligação instável), mostra um ecrã com opção de
 * recarregar em vez de deixar a app morta e em branco sem explicação.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Erro inesperado na app:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
          <img src="/logo.png" alt="RD Clima" className="h-16 w-16 rounded-full" />
          <p className="text-sm text-muted">Ocorreu um erro inesperado.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-deep hover:text-white"
          >
            Recarregar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
