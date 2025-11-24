import { useState, useEffect, useRef } from 'react'
import './styles/index.css'
// In production (Render), API is served from same origin
// In development (Vite), we need to point to localhost:8000
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:8000'
import RenameFiles from './components/RenameFiles'
import CreateFolders from './components/CreateFolders'
import GatherPhotos from './components/GatherPhotos'
import Settings from './components/Settings'
import Toast from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { useToast } from './hooks/useToast'
import { FileEdit, FolderPlus, Image, Settings as SettingsIcon, Factory, Circle, Menu, X, LogOut } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('rename')
  const [wsConnected, setWsConnected] = useState(false)
  const [logs, setLogs] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [availableCountries, setAvailableCountries] = useState([])
  const wsRef = useRef(null)
  const toast = useToast()
  const { logout, user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_URL}/api/folders/countries`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await response.json()
        if (data.success) {
          setAvailableCountries(data.countries)
        }
      } catch (error) {
        console.error('Error fetching countries:', error)
      }
    }
    fetchCountries()
  }, [user])

  useEffect(() => {
    if (!user) return

    // Connect to WebSocket for real-time updates
    let isInitialConnection = true
    
    const connectWebSocket = () => {
      // Determine WebSocket protocol (ws or wss) and host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.PROD ? window.location.host : 'localhost:8000'
    const wsUrl = `${protocol}//${host}/api/ws`

    const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setWsConnected(true)
        // Only show toast on reconnection, not initial connection
        if (!isInitialConnection) {
          toast.success('Conectado al servidor', 3000)
        }
        isInitialConnection = false
      }
      
      ws.onmessage = (event) => {
        setLogs(prev => [...prev, {
          message: event.data,
          timestamp: new Date().toISOString()
        }])
      }
      
      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setWsConnected(false)
        // Only show toast if not initial connection
        if (!isInitialConnection) {
          toast.warning('Desconectado del servidor. Reconectando...', 3000)
        }
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        // Only show toast if not initial connection
        if (!isInitialConnection) {
          toast.error('Error de conexión con el servidor', 4000)
        }
      }
      
      wsRef.current = ws
    }
    
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [user])

  const clearLogs = () => {
    setLogs([])
  }

  const tabs = [
    { id: 'rename', label: 'Renombrar Archivos', icon: FileEdit, component: RenameFiles, description: 'Procesar y renombrar imágenes' },
    { id: 'folders', label: 'Crear Carpetas', icon: FolderPlus, component: CreateFolders, description: 'Estructura de carpetas automática' },
    { id: 'photos', label: 'Reunir Fotos', icon: Image, component: GatherPhotos, description: 'Recopilar imágenes de Drive' },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon, component: Settings, description: 'Ajustes y ayuda' }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <ProtectedRoute>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo" style={{ opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s', width: sidebarOpen ? 'auto' : 0, overflow: 'hidden' }}>
              <Factory size={24} style={{ minWidth: '24px' }} />
              <span>LEBENGOOD</span>
            </div>
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Cerrar sidebar' : 'Abrir sidebar'}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '24px'
              }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={!sidebarOpen ? tab.label : ''}
                  style={{ width: '100%', background: 'transparent', border: 'none' }}
                >
                  <Icon size={20} />
                  {sidebarOpen && (
                    <span style={{ fontWeight: 600 }}>{tab.label}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="sidebar-footer" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="nav-item"
              onClick={logout}
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--danger)', marginBottom: '1rem' }}
            >
              <LogOut size={20} />
              {sidebarOpen && <span>Cerrar Sesión</span>}
            </button>
            <div className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: wsConnected ? 'var(--success)' : 'var(--danger)' }}>
              <Circle size={8} fill="currentColor" />
              {sidebarOpen && <span>{wsConnected ? 'Conectado' : 'Desconectado'}</span>}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="main-content">
          <header className="compact-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                className="menu-toggle-btn"
              >
                <Menu size={24} />
              </button>
            )}
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>{tabs.find(tab => tab.id === activeTab)?.description}</p>
            </div>
          </header>

          <main className="content-area">
            <ErrorBoundary>
              {ActiveComponent && <ActiveComponent logs={logs} clearLogs={clearLogs} toast={toast} availableCountries={availableCountries} />}
            </ErrorBoundary>
          </main>
        </div>
        
        {/* Toast Container */}
        <div className="toast-container">
          {toast.toasts.map(t => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              onClose={() => toast.removeToast(t.id)}
            />
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default App
