import { useState } from 'react'

import { Image, Globe, Folder, Lightbulb, Repeat, Rocket, Clock, Trash2, Info } from 'lucide-react'

// In production (Render), API is served from same origin
// In development (Vite), we need to point to localhost:8000
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:8000'

export default function GatherPhotos({ logs, clearLogs, toast }) {
  const [pais, setPais] = useState('')
  const [carpeta, setCarpeta] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!pais.trim()) {
      toast.warning('Por favor ingresa el nombre del país')
      return
    }
    
    if (!carpeta.trim()) {
      toast.warning('Por favor ingresa el nombre de la carpeta')
      return
    }

    if (!confirm(`¿Reunir fotos de ${pais} → ${carpeta}?`)) {
      return
    }

    setProcessing(true)

    try {
      const formData = new FormData()
      formData.append('pais', pais)
      formData.append('carpeta', carpeta)
      
      const response = await fetch(`${API_URL}/api/photos/gather`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error?.message || 'Error al reunir fotos'
        const errorCode = result.error?.code || 'UNKNOWN_ERROR'
        toast.error(`${errorMsg} (${errorCode})`, 6000)
        return
      }

      toast.success('¡Proceso completado exitosamente!', 5000)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(`Error de conexión: ${error.message}`, 5000)
    } finally {
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setPais('')
    setCarpeta('')
    clearLogs()
  }

  return (
    <div className="card slide-in">
      <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Image size={24} /> Reunir Fotos de Google Drive
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={16} /> País (en MAYÚSCULAS):
          </label>
          <input
            type="text"
            className="form-input"
            value={pais}
            onChange={(e) => setPais(e.target.value.toUpperCase())}
            placeholder="Ej: ESPAÑA, ALEMANIA, FRANCIA..."
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Folder size={16} /> Carpeta (en MAYÚSCULAS):
          </label>
          <input
            type="text"
            className="form-input"
            value={carpeta}
            onChange={(e) => setCarpeta(e.target.value.toUpperCase())}
            placeholder="Ej: ALBORNOZ"
          />
        </div>

        <div style={{ background: 'var(--surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <Lightbulb size={16} style={{ marginRight: '0.5rem' }} /> <strong>Ejemplo:</strong> País='ESPAÑA', Carpeta='ALBORNOZ'
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            <Repeat size={14} style={{ marginRight: '0.5rem' }} /> Se procesarán todas las subcarpetas con imágenes sin duplicaciones
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={processing || !pais.trim() || !carpeta.trim()}
            style={{ flex: 1, justifyContent: 'center', fontSize: '1.1rem', padding: '1rem' }}
          >
            {processing ? (
              <><Clock size={20} style={{ marginRight: '0.5rem' }} /> Procesando...</>
            ) : (
              <><Rocket size={20} style={{ marginRight: '0.5rem' }} /> Ejecutar Proceso</>
            )}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetForm}
            style={{ padding: '1rem 1.5rem' }}
          >
            <Trash2 size={18} style={{ marginRight: '0.5rem' }} /> Limpiar
          </button>
        </div>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--surface-glass)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={18} /> Características del proceso:
        </h4>
        <ul style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>
          <li>Exploración completa de todas las subcarpetas</li>
          <li>Procesamiento secuencial sin duplicaciones</li>
          <li>Creación automática de archivo ZIP</li>
          <li>Subida del ZIP de vuelta a Google Drive</li>
        </ul>
      </div>


    </div>
  )
}
