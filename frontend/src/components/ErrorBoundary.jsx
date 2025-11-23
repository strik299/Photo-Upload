import { Component } from 'react'
import { XCircle, RotateCcw, RefreshCw } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          background: 'var(--surface-elevated)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--danger)',
          margin: '2rem'
        }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={24} /> Algo salió mal
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            La aplicación encontró un error inesperado. Por favor, intenta recargar la página.
          </p>
          {this.state.error && (
            <details style={{
              background: 'var(--surface)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem'
            }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
                Detalles técnicos
              </summary>
              <pre style={{
                marginTop: '1rem',
                fontSize: '0.85rem',
                overflow: 'auto',
                color: 'var(--danger)'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn btn-primary"
              onClick={this.handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RotateCcw size={16} /> Intentar de nuevo
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
