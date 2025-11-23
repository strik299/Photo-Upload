import { useAuth } from '../context/AuthContext'
import Login from './Login'
import { Clock } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Clock size={32} className="spin" style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
          <p>Cargando sesión...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return children
}
