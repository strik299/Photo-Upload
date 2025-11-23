import { useEffect, useRef } from 'react'
import { List, Trash2, FileText, CheckCircle, XCircle, AlertTriangle, PartyPopper } from 'lucide-react'

export default function LogDisplay({ logs, onClear }) {
  const logContainerRef = useRef(null)

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  const getLogClass = (message) => {
    if (message.toLowerCase().includes('success') || message.toLowerCase().includes('completado') || message.toLowerCase().includes('éxito')) return 'success'
    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) return 'error'
    if (message.toLowerCase().includes('warning') || message.toLowerCase().includes('advertencia')) return 'warning'
    return 'info'
  }

  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <List size={20} /> Registro de Actividad
        </h3>
        {logs.length > 0 && (
          <button className="btn btn-secondary" onClick={onClear} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trash2 size={16} /> Limpiar
          </button>
        )}
      </div>
      
      <div className="log-container" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={40} />
            </div>
            <p>No hay mensajes aún</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-message ${getLogClass(log.message)}`}>
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
