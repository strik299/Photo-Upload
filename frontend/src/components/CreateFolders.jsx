import { useState, useEffect } from 'react'

import { FolderPlus, Package, Palette, Plus, List, X, Info, Rocket, Clock, Check, Search } from 'lucide-react'

export default function CreateFolders({ logs, clearLogs, toast, availableCountries = [] }) {
  const [nombreCarpeta, setNombreCarpeta] = useState('')
  const [selectedCountries, setSelectedCountries] = useState([])
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Select all by default if empty and countries are available
    if (selectedCountries.length === 0 && availableCountries.length > 0) {
      setSelectedCountries(availableCountries)
    }
  }, [availableCountries])

  const toggleCountry = (country) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter(c => c !== country))
    } else {
      setSelectedCountries([...selectedCountries, country])
    }
  }

  // Filter countries based on search term
  const filteredCountries = availableCountries.filter(country => 
    country.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleAll = () => {
    // If all filtered countries are selected, deselect them
    const allFilteredSelected = filteredCountries.every(c => selectedCountries.includes(c))
    
    if (allFilteredSelected) {
      // Remove filtered countries from selection
      setSelectedCountries(selectedCountries.filter(c => !filteredCountries.includes(c)))
    } else {
      // Add all filtered countries to selection (avoiding duplicates)
      const newSelection = [...selectedCountries]
      filteredCountries.forEach(c => {
        if (!newSelection.includes(c)) {
          newSelection.push(c)
        }
      })
      setSelectedCountries(newSelection)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!nombreCarpeta.trim()) {
      toast.warning('Por favor ingresa el nombre de la carpeta')
      return
    }
    
    if (selectedCountries.length === 0) {
      toast.warning('Por favor selecciona al menos un país')
      return
    }

    if (!confirm(`¿Crear carpeta "${nombreCarpeta}" en ${selectedCountries.length} países?`)) {
      return
    }

    setProcessing(true)

    try {
      const formData = new FormData()
      formData.append('nombre_carpeta', nombreCarpeta)
      formData.append('paises', selectedCountries.join(','))
      
      const response = await fetch('http://localhost:8000/api/folders/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error?.message || 'Error al crear estructura'
        const errorCode = result.error?.code || 'UNKNOWN_ERROR'
        toast.error(`${errorMsg} (${errorCode})`, 6000)
        return
      }

      toast.success(`¡Éxito! ${result.total_carpetas} carpetas creadas en ${result.paises_procesados} países`, 5000)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(`Error de conexión: ${error.message}`, 5000)
    } finally {
      setProcessing(false)
    }
  }

  const getCountryFlag = (countryName) => {
    // Normalize string to handle accents/special chars
    const normalized = countryName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    
    const map = {
      'ESPANA': '🇪🇸',
      'SPAIN': '🇪🇸',
      'FRANCIA': '🇫🇷',
      'FRANCE': '🇫🇷',
      'ITALIA': '🇮🇹',
      'ITALY': '🇮🇹',
      'ALEMANIA': '🇩🇪',
      'GERMANY': '🇩🇪',
      'UK': '🇬🇧',
      'REINO UNIDO': '🇬🇧',
      'UNITED KINGDOM': '🇬🇧',
      'USA': '🇺🇸',
      'ESTADOS UNIDOS': '🇺🇸',
      'PORTUGAL': '🇵🇹',
      'HOLANDA': '🇳🇱',
      'PAISES BAJOS': '🇳🇱',
      'NETHERLANDS': '🇳🇱',
      'POLONIA': '🇵🇱',
      'POLAND': '🇵🇱',
      'SUECIA': '🇸🇪',
      'SWEDEN': '🇸🇪',
      'BELGICA': '🇧🇪',
      'BELGIUM': '🇧🇪',
      'AUSTRIA': '🇦🇹',
      'SUIZA': '🇨🇭',
      'SWITZERLAND': '🇨🇭'
    }
    
    // Try direct match first, then normalized
    return map[countryName.toUpperCase()] || map[normalized] || '🌍'
  }

  return (
    <div className="card slide-in">
      <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FolderPlus size={24} /> Crear Carpetas por País
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} /> Nombre de la Carpeta:
          </label>
          <input
            type="text"
            className="form-input"
            value={nombreCarpeta}
            onChange={(e) => setNombreCarpeta(e.target.value.toUpperCase())}
            placeholder="Ej: ALBORNOZ"
            style={{ fontWeight: 'bold', fontSize: '1.1rem' }}
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <List size={16} /> Seleccionar Países:
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={toggleAll}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
            >
              {filteredCountries.every(c => selectedCountries.includes(c)) && filteredCountries.length > 0
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
                const isSelected = selectedCountries.includes(country)
                return (
                  <div 
                    key={country} 
                    onClick={() => toggleCountry(country)}
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
            {selectedCountries.length} de {availableCountries.length} países seleccionados
          </div>
        </div>

        <div style={{ background: 'var(--surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            <Info size={16} style={{ marginRight: '0.5rem' }} /> La carpeta se creará en: <br />
            <code style={{ color: 'var(--primary)' }}>
              LEBENGOOD/FOTOS/FOTOS ORDENADAS/[PAÍS]/{nombreCarpeta || '[CARPETA]'}
            </code>
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={processing || !nombreCarpeta.trim() || selectedCountries.length === 0}
          style={{ width: '100%', justifyContent: 'center', fontSize: '1.1rem', padding: '1rem' }}
        >
          {processing ? (
            <><Clock size={20} style={{ marginRight: '0.5rem' }} /> Creando...</>
          ) : (
            <><Rocket size={20} style={{ marginRight: '0.5rem' }} /> Crear Carpetas</>
          )}
        </button>
      </form>


    </div>
  )
}
