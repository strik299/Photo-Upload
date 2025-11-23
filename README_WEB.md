# LEBENGOOD - Interfaz Web

Aplicación web moderna para gestionar archivos en Google Drive usando React y FastAPI.

## 🚀 Inicio Rápido

### Requisitos Previos
- Python 3.8+
- Node.js 16+
- Archivo `credentials.json` de Google Cloud Console

### 1. Configurar Backend

```bash
# Navegar a la carpeta del backend
cd backend

# Crear entorno virtual (opcional pero recomendado)
python3 -m venv venv
source venv/bin/activate  # En Mac/Linux
# venv\Scripts\activate  # En Windows

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en `http://localhost:8000`

### 2. Configurar Frontend

```bash
# Navegar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
Amazon-photo/
├── backend/
│   ├── main.py              # Aplicación FastAPI
│   ├── requirements.txt     # Dependencias Python
│   ├── api/
│   │   └── routes.py       # Rutas API
│   ├── services/
│   │   ├── google_drive.py # Servicio Google Drive
│   │   └── file_processor.py # Procesador de archivos
│   └── utils/
│       └── helpers.py       # Funciones auxiliares
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Componente principal
│   │   ├── main.jsx         # Punto de entrada
│   │   ├── components/      # Componentes React
│   │   └── styles/          # Estilos CSS
│   └── package.json
├── credentials.json         # Credenciales OAuth (requerido)
└── lebengood_unified.py    # Aplicación tkinter original
```

## 🔑 Configuración de Google Drive API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Google Drive API
4. Crea credenciales OAuth 2.0 (Aplicación de escritorio)
5. Configura URIs de redirección:
   - `http://localhost:8080/`
   - `http://localhost/`
   - `http://127.0.0.1:8080/`
6. Descarga el archivo JSON y guárdalo como `credentials.json` en la raíz del proyecto

## 📝 Módulos Disponibles

### 1. Renombrar Archivos
- Procesa múltiples carpetas de imágenes
- Convierte PNG a JPG automáticamente
- Renombra con códigos específicos
- Valida formatos .PT
- Sube a Google Drive

### 2. Crear Carpetas
- Crea estructura automática en todos los países
- Gestiona múltiples colores
- Verifica carpetas existentes

### 3. Reunir Fotos
- Descarga fotos de carpetas específicas
- Procesamiento sin duplicaciones
- Crea y sube ZIP a Drive

## 🎨 Características

✅ Interfaz moderna con diseño oscuro  
✅ Actualizaciones en tiempo real vía WebSocket  
✅ Animaciones suaves y efectos glassmorphism  
✅ Responsive design  
✅ Validación de formularios  
✅ Logs en tiempo real

## 🛠️ Desarrollo

### Backend
```bash
# Modo desarrollo con recarga automática
uvicorn backend.main:app --reload
```

### Frontend
```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview producción
npm run preview
```

## 📦 Producción

```bash
# Build frontend
cd frontend
npm run build

# El backend sirve automáticamente los archivos estáticos
# Solo necesitas ejecutar el backend:
cd ../backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## ⚠️ Solución de Problemas

### Error: redirect_uri_mismatch
- Verifica que las URIs de redirección estén configuradas en Google Cloud Console
- Elimina `token.json` y vuelve a autenticar

### Error: PIL not available
- Instala Pillow: `pip install Pillow`

### WebSocket no conecta
- Verifica que el backend esté ejecutándose en el puerto 8000
- Asegúrate de que no haya CORS blocking

## 📄 Licencia

Este proyecto es para uso interno de LEBENGOOD.

## 🔗 Referencias

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Google Drive API](https://developers.google.com/drive)
