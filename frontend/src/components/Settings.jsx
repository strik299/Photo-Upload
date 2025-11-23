import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Cloud, Info, CheckCircle, XCircle, LogOut, Image as ImageIcon, Key, Ticket, Folder, FileEdit, HelpCircle, Lightbulb, Factory } from 'lucide-react'

export default function Settings() {
  const [authStatus, setAuthStatus] = useState(null)
  const [configInfo, setConfigInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
    loadConfigInfo()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/status')
      const data = await response.json()
      setAuthStatus(data)
    } catch (error) {
      console.error('Error checking auth:', error)
      setAuthStatus({ authenticated: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const loadConfigInfo = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/config/info')
      const data = await response.json()
      setConfigInfo(data)
    } catch (error) {
      console.error('Error loading config:', error)
    }
  }

  const handleLogout = async () => {
    if (!confirm('¿Cerrar sesión y eliminar token de autenticación?')) {
      return
    }

    try {
      await fetch('http://localhost:8000/api/auth/logout', { method: 'POST' })
      alert('Sesión cerrada exitosamente')
      checkAuthStatus()
    } catch (error) {
      alert('Error al cerrar sesión: ' + error.message)
    }
  }

  return (
    <div className="card slide-in">
      <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <SettingsIcon size={24} /> Configuración y Ayuda
      </h2>
      
      {/* Authentication Status */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cloud size={20} /> Google Drive API
        </h3>
        <div style={{ background: 'var(--surface-elevated)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <span className={`badge ${authStatus?.authenticated ? 'badge-success' : 'badge-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {authStatus?.authenticated ? (
                    <><CheckCircle size={16} /> Autenticado</>
                  ) : (
                    <><XCircle size={16} /> No autenticado</>
                  )}
                </span>
              </div>
              
              {authStatus?.authenticated && (
                <button className="btn btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              )}
              
              {authStatus?.error && (
                <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>
                  Error: {authStatus.error}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* System Information */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={20} /> Información del Sistema
        </h3>
        <div style={{ background: 'var(--surface-elevated)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
          {configInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ImageIcon size={16} /> Conversión PNG→JPG:
                </span>
                <span className={`badge ${configInfo.pil_available ? 'badge-success' : 'badge-danger'}`}>
                  {configInfo.pil_available ? 'Disponible' : 'No disponible'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={16} /> Archivo credentials.json:
                </span>
                <span className={`badge ${configInfo.credentials_exist ? 'badge-success' : 'badge-danger'}`}>
                  {configInfo.credentials_exist ? 'Encontrado' : 'No encontrado'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Ticket size={16} /> Token de autenticación:
                </span>
                <span className={`badge ${configInfo.token_exist ? 'badge-success' : 'badge-danger'}`}>
                  {configInfo.token_exist ? 'Encontrado' : 'No encontrado'}
                </span>
              </div>
            </div>
          ) : (
            <p>Cargando información...</p>
          )}
        </div>
      </div>

      {/* Help Documentation */}
      <div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HelpCircle size={20} /> Ayuda y Documentación
        </h3>
        <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', maxHeight: '400px', overflowY: 'auto' }}>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Factory size={20} /> LEBENGOOD - Suite Unificada
            </h4>
            
            <p style={{ marginBottom: '1rem' }}>
              Esta aplicación web unifica tres herramientas principales para gestionar archivos en Google Drive:
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileEdit size={18} /> RENOMBRAR ARCHIVOS:
              </h5>
              <ul style={{ marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                <li>Procesa múltiples carpetas de imágenes</li>
                <li>Renombra archivos con códigos específicos (deben empezar por 'B')</li>
                <li>Convierte PNG a JPG automáticamente (si PIL está disponible)</li>
                <li>Valida formatos .PT con exactamente 2 dígitos</li>
                <li>Sube archivos y ZIP a Google Drive</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Folder size={18} /> CREAR CARPETAS:
              </h5>
              <ul style={{ marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                <li>Crea estructura automática en todos los países</li>
                <li>Estructura: LEBENGOOD/FOTOS/FOTOS ORDENADAS/[PAÍS]/[ARTÍCULO]/[COLOR]</li>
                <li>Permite añadir múltiples colores</li>
                <li>Verifica y crea solo carpetas faltantes</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={18} /> REUNIR FOTOS:
              </h5>
              <ul style={{ marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                <li>Busca y descarga fotos de carpetas específicas</li>
                <li>Procesamiento completo de todas las subcarpetas</li>
                <li>Evita duplicaciones automáticamente</li>
                <li>Crea ZIP y lo sube de vuelta a Google Drive</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ color: 'var(--warning)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SettingsIcon size={18} /> CONFIGURACIÓN NECESARIA:
              </h5>
              <ol style={{ marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                <li>Descargar credentials.json de Google Cloud Console</li>
                <li>Habilitar Google Drive API</li>
                <li>Configurar URIs de redirección OAuth</li>
                <li>Iniciar el servidor backend (uvicorn)</li>
              </ol>
            </div>

            <div style={{ background: 'var(--surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lightbulb size={14} /> Consejo:
                </strong> Todas las carpetas y códigos se convierten automáticamente a MAYÚSCULAS.
                El procesamiento es secuencial para evitar duplicados y errores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
