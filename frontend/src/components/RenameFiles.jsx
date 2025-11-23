import { useState, useEffect } from 'react'

import { FileEdit, Package, Tag, Folder, FolderPlus, X, Image as ImageIcon, Rocket, Clock, Info, CheckCircle, AlertTriangle, ArrowLeft, Eye, Upload, Grid, Globe, Check, Search, List } from 'lucide-react'

export default function RenameFiles({ logs, clearLogs, toast, availableCountries = [] }) {
  const [mode, setMode] = useState('folders') // 'folders' or 'direct'
  const [articulo, setArticulo] = useState('')
  const [codigos, setCodigos] = useState('')
  
  // Folder Mode State
  const [carpetas, setCarpetas] = useState([])
  const [selectedFolderCountries, setSelectedFolderCountries] = useState([])
  
  // Direct Mode State
  const [directFiles, setDirectFiles] = useState(Array(10).fill(null))
  const [selectedCountry, setSelectedCountry] = useState('')
  const [color, setColor] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Shared State
  const [processing, setProcessing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const countryMap = {
    'ESPAÑA': ' ES', 'ALEMANIA': ' DE', 'FRANCIA': ' FR', 
    'ITALIA': ' IT', 'UK': ' UK', 'NETHERLANDS': ' NE', 
    'POLONIA': ' PL', 'SUECIA': ' SE'
  }

  useEffect(() => {
    // Select all by default for folder mode if empty and countries are available
    if (selectedFolderCountries.length === 0 && availableCountries.length > 0) {
      setSelectedFolderCountries(availableCountries)
    }
  }, [availableCountries])

  const getCountryFlag = (countryName) => {
    const normalized = countryName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const map = {
      'ESPANA': '🇪🇸', 'SPAIN': '🇪🇸', 'FRANCIA': '🇫🇷', 'FRANCE': '🇫🇷',
      'ITALIA': '🇮🇹', 'ITALY': '🇮🇹', 'ALEMANIA': '🇩🇪', 'GERMANY': '🇩🇪',
      'UK': '🇬🇧', 'REINO UNIDO': '🇬🇧', 'UNITED KINGDOM': '🇬🇧',
      'USA': '🇺🇸', 'ESTADOS UNIDOS': '🇺🇸', 'PORTUGAL': '🇵🇹',
      'HOLANDA': '🇳🇱', 'PAISES BAJOS': '🇳🇱', 'NETHERLANDS': '🇳🇱',
      'POLONIA': '🇵🇱', 'POLAND': '🇵🇱', 'SUECIA': '🇸🇪', 'SWEDEN': '🇸🇪',
      'BELGICA': '🇧🇪', 'BELGIUM': '🇧🇪', 'AUSTRIA': '🇦🇹',
      'SUIZA': '🇨🇭', 'SWITZERLAND': '🇨🇭'
    }
    return map[countryName.toUpperCase()] || map[normalized] || '🌍'
  }

  const filteredCountries = availableCountries.filter(country => 
    country.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleFolderCountry = (country) => {
    if (selectedFolderCountries.includes(country)) {
      setSelectedFolderCountries(selectedFolderCountries.filter(c => c !== country))
    } else {
      setSelectedFolderCountries([...selectedFolderCountries, country])
    }
  }

  const toggleAllFolderCountries = () => {
    const allFilteredSelected = filteredCountries.every(c => selectedFolderCountries.includes(c))
    if (allFilteredSelected) {
      setSelectedFolderCountries(selectedFolderCountries.filter(c => !filteredCountries.includes(c)))
    } else {
      const newSelection = [...selectedFolderCountries]
      filteredCountries.forEach(c => {
        if (!newSelection.includes(c)) newSelection.push(c)
      })
      setSelectedFolderCountries(newSelection)
    }
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    
    if (!articulo.trim()) {
      toast.warning('Por favor ingresa el nombre del artículo')
      return
    }
    
    if (!codigos.trim()) {
      toast.warning('Por favor ingresa al menos un código')
      return
    }

    const codeList = codigos.split(',').map(c => c.trim())
    const invalidLength = codeList.filter(c => c.length !== 10)
    
    if (invalidLength.length > 0) {
      toast.warning(`Los códigos deben tener 10 caracteres: ${invalidLength.join(', ')}`)
      return
    }
    
    if (mode === 'folders') {
      if (carpetas.length === 0) {
        toast.warning('Por favor selecciona al menos una carpeta')
        return
      }
      if (selectedFolderCountries.length === 0) {
        toast.warning('Por favor selecciona al menos un país')
        return
      }
      await analyzeFolders()
    }
  }

  const analyzeFolders = async () => {
    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('articulo', articulo)
      formData.append('codigos', codigos)
      
      carpetas.forEach(carpeta => {
        selectedFolderCountries.forEach(country => {
          const countrySuffix = countryMap[country] || ''
          // Folder name is the color, e.g., "ROJO" -> "ROJO ES"
          const virtualFolderName = `${carpeta.name}${countrySuffix}`.toUpperCase()
          
          carpeta.files.forEach(file => {
            formData.append('folders', file, `${virtualFolderName}/${file.name}`)
          })
        })
      })
      
      const response = await fetch('http://localhost:8000/api/rename/preview', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error?.message || 'Error en el análisis'
        toast.error(errorMsg, 6000)
        return
      }

      setPreviewData(result)
      setPreviewMode(true)
      toast.success('Análisis completado')
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(`Error de conexión: ${error.message}`, 5000)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDirectUpload = async (index, file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen')
      return
    }
    const newFiles = [...directFiles]
    newFiles[index] = file
    setDirectFiles(newFiles)
  }

  const removeDirectFile = (index) => {
    const newFiles = [...directFiles]
    newFiles[index] = null
    setDirectFiles(newFiles)
  }

  const handleProcessDirect = async () => {
    if (!articulo.trim() || !codigos.trim() || !selectedCountry || !color.trim()) {
      toast.warning('Por favor completa todos los campos')
      return
    }

    const codeList = codigos.split(',').map(c => c.trim())
    const invalidLength = codeList.filter(c => c.length !== 10)
    
    if (invalidLength.length > 0) {
      toast.warning(`Los códigos deben tener 10 caracteres: ${invalidLength.join(', ')}`)
      return
    }

    const validFiles = directFiles.filter(f => f !== null)
    if (validFiles.length === 0) {
      toast.warning('Por favor sube al menos una foto')
      return
    }

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('articulo', articulo)
      formData.append('codigos', codigos)
      
      const countrySuffix = countryMap[selectedCountry] || ''
      const folderName = `${color}${countrySuffix}`.toUpperCase()
      
      directFiles.forEach((file, index) => {
        if (file) {
          let newName
          const ext = file.name.split('.').pop()
          if (index === 0) {
            newName = `temp.MAIN.${ext}`
          } else {
            const ptNum = index.toString().padStart(2, '0')
            newName = `temp.PT${ptNum}.${ext}`
          }
          
          formData.append('folders', file, `${folderName}/${newName}`)
        }
      })
      
      const response = await fetch('http://localhost:8000/api/rename/process', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error?.message || 'Error en el procesamiento'
        toast.error(errorMsg, 6000)
        return
      }

      toast.success('¡Procesamiento completado exitosamente!')
      setDirectFiles(Array(10).fill(null))
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(`Error de conexión: ${error.message}`, 5000)
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmAndProcess = async () => {
    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('articulo', articulo)
      formData.append('codigos', codigos)
      
      carpetas.forEach(carpeta => {
        selectedFolderCountries.forEach(country => {
          const countrySuffix = countryMap[country] || ''
          const virtualFolderName = `${carpeta.name}${countrySuffix}`.toUpperCase()
          
          carpeta.files.forEach(file => {
            formData.append('folders', file, `${virtualFolderName}/${file.name}`)
          })
        })
      })
      
      const response = await fetch('http://localhost:8000/api/rename/process', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error?.message || 'Error en el procesamiento'
        toast.error(errorMsg, 6000)
        return
      }

      toast.success('¡Procesamiento completado exitosamente!')
      setPreviewMode(false)
      setPreviewData(null)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(`Error de conexión: ${error.message}`, 5000)
    } finally {
      setProcessing(false)
    }
  }

  const addCarpeta = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.directory = true
    input.onchange = (e) => {
      const files = Array.from(e.target.files).filter(file => 
        !file.name.startsWith('.') && file.name !== 'Thumbs.db'
      )
      
      if (files.length > 0) {
        const folderName = files[0].webkitRelativePath.split('/')[0]
        if (!carpetas.find(c => c.name === folderName)) {
          setCarpetas([...carpetas, { name: folderName, files }])
        }
      }
    }
    input.click()
  }

  const removeCarpeta = (index) => {
    setCarpetas(carpetas.filter((_, i) => i !== index))
  }

  const backToForm = () => {
    setPreviewMode(false)
    setPreviewData(null)
  }

  const hasNonImageFiles = () => {
    if (!previewData) return false
    return previewData.folders.some(folder => 
      folder.files.invalid.some(file => file.reason === "No es un archivo de imagen")
    )
  }

  const handleProcessOnlyPhotos = async () => {
    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('articulo', articulo)
      formData.append('codigos', codigos)
      formData.append('only_images', 'true')
      
      carpetas.forEach(carpeta => {
        selectedFolderCountries.forEach(country => {
          const countrySuffix = countryMap[country] || ''
          const virtualFolderName = `${carpeta.name}${countrySuffix}`.toUpperCase()
          
          carpeta.files.forEach(file => {
            formData.append('folders', file, `${virtualFolderName}/${file.name}`)
          })
        })
      })
      
      const response = await fetch('http://localhost:8000/api/rename/process', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error?.message || 'Error en el procesamiento'
        toast.error(errorMsg, 6000)
        return
      }

      toast.success('¡Procesamiento completado exitosamente! (Solo fotos)')
      setPreviewMode(false)
      setPreviewData(null)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(`Error de conexión: ${error.message}`, 5000)
    } finally {
      setProcessing(false)
    }
  }

  // Preview Mode UI
  if (previewMode && previewData) {
    return (
      <div className="card slide-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Eye size={24} /> Vista Previa de Procesamiento
          </h2>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={backToForm}
            disabled={processing}
          >
            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Volver
          </button>
        </div>

        {/* Code Validation */}
        {previewData.codes_validation.invalid.length > 0 && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={20} color="#ef4444" />
              <strong style={{ color: '#ef4444' }}>Códigos Inválidos</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Los siguientes códigos no empiezan por 'B': {previewData.codes_validation.invalid.join(', ')}
            </p>
          </div>
        )}

        {/* Summary Card */}
        <div style={{
          background: 'var(--surface-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(0, 102, 255, 0.2)'
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>📊 Resumen</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Carpetas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{previewData.summary.total_folders}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Archivos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{previewData.summary.total_files}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Archivos Válidos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{previewData.summary.total_valid}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Archivos Inválidos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: previewData.summary.total_invalid > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{previewData.summary.total_invalid}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>PNGs a Convertir</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>{previewData.summary.total_pngs_to_convert}</div>
            </div>
          </div>
        </div>

        {/* Folder Details */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>📁 Detalles por Carpeta</h3>
          {previewData.folders.map((folder, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '1rem',
              border: '1px solid rgba(0, 102, 255, 0.1)'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Folder size={20} />
                  <strong style={{ fontSize: '1.1rem' }}>{folder.name}</strong>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>🌍 País: <strong>{folder.detected_country || 'No detectado'}</strong></span>
                  <span>🎨 Color: <strong>{folder.detected_color || 'No detectado'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(77, 166, 255, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{folder.stats.total}</div>
                </div>
                <div style={{ background: 'rgba(77, 166, 255, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Válidos</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{folder.stats.valid}</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inválidos</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{folder.stats.invalid}</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNGs</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{folder.stats.pngs_to_convert}</div>
                </div>
              </div>

              {/* Invalid Files */}
              {folder.files.invalid.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                    ❌ Archivos Inválidos:
                  </div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {folder.files.invalid.map((file, fileIdx) => (
                      <div key={fileIdx} style={{
                        fontSize: '0.85rem',
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.05)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.25rem'
                      }}>
                        <div style={{ fontWeight: 'bold' }}>{file.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{file.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Files Preview */}
              {folder.files.valid.length > 0 && (
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                    ✅ Ver archivos válidos ({folder.files.valid.length})
                  </summary>
                  <div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {folder.files.valid.map((file, fileIdx) => (
                      <div key={fileIdx} style={{
                        fontSize: '0.85rem',
                        padding: '0.4rem',
                        background: 'rgba(77, 166, 255, 0.05)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.25rem'
                      }}>
                        {file}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={backToForm}
            disabled={processing}
          >
            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Cancelar
          </button>
          
          {/* Show 'Process Only Photos' button if there are non-image files */}
          {hasNonImageFiles() && previewData.summary.total_valid > 0 && (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleProcessOnlyPhotos}
              disabled={processing || previewData.codes_validation.invalid.length > 0}
              style={{ minWidth: '200px' }}
            >
              {processing ? (
                <><Clock size={20} style={{ marginRight: '0.5rem' }} /> Procesando...</>
              ) : (
                <><ImageIcon size={20} style={{ marginRight: '0.5rem' }} /> Procesar Solo Fotos</>
              )}
            </button>
          )}
          
          {/* Show 'Confirm and Process' ONLY if there are NO invalid files */}
          {previewData.summary.total_invalid === 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmAndProcess}
              disabled={processing || previewData.summary.total_valid === 0 || previewData.codes_validation.invalid.length > 0}
              style={{ minWidth: '200px' }}
            >
              {processing ? (
                <><Clock size={20} style={{ marginRight: '0.5rem' }} /> Procesando...</>
              ) : (
                <><CheckCircle size={20} style={{ marginRight: '0.5rem' }} /> Confirmar y Procesar</>
              )}
            </button>
          )}
        </div>


      </div>
    )
  }

  // Form Mode UI
  return (
    <div className="card slide-in">
      <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileEdit size={24} /> Renombrar Archivos para Amazon
      </h2>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        <button
          className={`btn ${mode === 'folders' ? 'btn-primary' : ''}`}
          onClick={() => setMode('folders')}
          style={{ 
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            border: '1px solid transparent', // Base border to prevent jump
            ...(mode === 'folders' ? {
              borderBottom: 'none'
            } : {
              background: 'rgba(59, 130, 246, 0.1)',
              borderColor: 'var(--primary)',
              borderBottom: 'none',
              color: 'var(--text-secondary)'
            })
          }}
        >
          <Folder size={18} style={{ marginRight: '0.5rem' }} /> Por Carpetas
        </button>
        <button
          className={`btn ${mode === 'direct' ? 'btn-primary' : ''}`}
          onClick={() => setMode('direct')}
          style={{ 
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            border: '1px solid transparent', // Base border to prevent jump
            ...(mode === 'direct' ? {
              borderBottom: 'none'
            } : {
              background: 'rgba(59, 130, 246, 0.1)',
              borderColor: 'var(--primary)',
              borderBottom: 'none',
              color: 'var(--text-secondary)'
            })
          }}
        >
          <Grid size={18} style={{ marginRight: '0.5rem' }} /> Subida Directa
        </button>
      </div>

      <form onSubmit={handleAnalyze}>
        <div className="section-card">
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={16} /> Artículo:
            </label>
            <input
              type="text"
              className="form-input"
              value={articulo}
              onChange={(e) => setArticulo(e.target.value.toUpperCase())}
              placeholder="Ej: ALBORNOZ"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={16} /> Códigos (separados por coma):
            </label>
            <input
              type="text"
              className="form-input"
              value={codigos}
              onChange={(e) => setCodigos(e.target.value.toUpperCase())}
              placeholder="Ej: B001, B002, B003"
            />
            <small style={{ color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Info size={14} /> Todos los códigos deben empezar por 'B' y tener 10 caracteres
            </small>
          </div>
        </div>

        {mode === 'folders' ? (
          // FOLDER MODE
          <>
            <div className="section-card">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <List size={16} /> Seleccionar Países:
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={toggleAllFolderCountries}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {filteredCountries.every(c => selectedFolderCountries.includes(c)) && filteredCountries.length > 0
                      ? 'Deseleccionar Visibles' 
                      : 'Seleccionar Visibles'}
                  </button>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar país..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex'
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                  gap: '0.5rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  {filteredCountries.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                      <p>No se encontraron países</p>
                    </div>
                  ) : (
                    filteredCountries.map((country) => {
                      const isSelected = selectedFolderCountries.includes(country)
                      return (
                        <div 
                          key={country} 
                          onClick={() => toggleFolderCountry(country)}
                          className={`country-card ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="country-card-flag">
                            {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                          </div>
                          
                          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{getCountryFlag(country)}</span>
                          
                          <span className="country-card-name">
                            {country}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
                
                <div className="badge" style={{ marginTop: '0.5rem' }}>
                  {selectedFolderCountries.length} de {availableCountries.length} países seleccionados
                </div>
              </div>
            </div>

            <div className="section-card">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Folder size={16} /> Carpetas a procesar:
                </label>
                <div className="item-list">
                  {carpetas.length === 0 ? (
                    <div className="empty-state">
                      <p>No hay carpetas seleccionadas</p>
                    </div>
                  ) : (
                    carpetas.map((carpeta, index) => (
                      <div key={index} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Folder size={16} /> {carpeta.name}
                        </span>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeCarpeta(index)}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          <X size={16} style={{ marginRight: '0.25rem' }} /> Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addCarpeta}
                  style={{ marginTop: '1rem' }}
                  disabled={carpetas.length >= 1}
                >
                  <FolderPlus size={18} style={{ marginRight: '0.5rem' }} /> {carpetas.length >= 1 ? 'Solo 1 carpeta permitida' : 'Agregar Carpeta'}
                </button>
                
                {carpetas.length > 0 && (
                  <div className="badge" style={{ marginLeft: '1rem' }}>
                    {carpetas.length} {carpetas.length === 1 ? 'carpeta' : 'carpetas'}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={analyzing || carpetas.length === 0 || selectedFolderCountries.length === 0}
              style={{ width: '100%', justifyContent: 'center', fontSize: '1.1rem', padding: '1rem', marginTop: '2rem' }}
            >
              {analyzing ? (
                <><Clock size={20} style={{ marginRight: '0.5rem' }} /> Analizando...</>
              ) : (
                <><Eye size={20} style={{ marginRight: '0.5rem' }} /> Analizar Archivos</>
              )}
            </button>
          </>
        ) : (
          // DIRECT MODE
          <>
            <div className="section-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">País</label>
                  <select
                    className="form-input"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    <option value="">Seleccionar País</option>
                    {availableCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Color</label>
                  <input
                    type="text"
                    className="form-input"
                    value={color}
                    onChange={(e) => setColor(e.target.value.toUpperCase())}
                    placeholder="Ej: NEGRO"
                  />
                </div>
              </div>
            </div>

            <div className="section-card">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ImageIcon size={16} /> Fotos (Máx 10):
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  {directFiles.map((file, index) => (
                    <div 
                      key={index}
                      style={{
                        aspectRatio: '1',
                        border: '2px dashed var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        background: file ? 'var(--surface-glass)' : 'transparent',
                        transition: 'all 0.2s ease',
                        overflow: 'hidden'
                      }}
                      onClick={() => !file && document.getElementById(`file-upload-${index}`).click()}
                    >
                      <input
                        id={`file-upload-${index}`}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleDirectUpload(index, e.target.files[0])
                            e.target.value = '' // Reset input to allow re-selecting same file
                          }
                        }}
                      />
                      
                      {file ? (
                        <>
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt="Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} 
                          />
                          <div style={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0, 
                            background: 'rgba(0,0,0,0.7)', 
                            color: 'white', 
                            fontSize: '0.7rem', 
                            padding: '2px', 
                            textAlign: 'center' 
                          }}>
                            {index === 0 ? '.MAIN' : `.PT${index.toString().padStart(2,'0')}`}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeDirectFile(index)
                            }}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              background: 'rgba(239, 68, 68, 0.8)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {index === 0 ? 'MAIN' : `PT${index.toString().padStart(2,'0')}`}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleProcessDirect}
              disabled={processing || !directFiles.some(f => f !== null)}
              style={{ width: '100%', justifyContent: 'center', fontSize: '1.1rem', padding: '1rem', marginTop: '2rem' }}
            >
              {processing ? (
                <><Clock size={20} style={{ marginRight: '0.5rem' }} /> Procesando...</>
              ) : (
                <><Rocket size={20} style={{ marginRight: '0.5rem' }} /> Procesar Fotos</>
              )}
            </button>
          </>
        )}
      </form>


    </div>
  )
}

