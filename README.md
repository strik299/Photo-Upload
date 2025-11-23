# 📸 Amazon Photo Processor - Suite Completa

Esta suite de herramientas de Python automatiza el procesamiento de fotos para Amazon, incluyendo renombrado masivo, conversión de formatos, organización por países/colores, y subida a Google Drive.

## Códigos paises
🇪🇸 ESPAÑA      →  " ES"
🇩🇪 ALEMANIA    →  " DE" 
🇫🇷 FRANCIA     →  " FR"
🇮🇹 ITALIA      →  " IT"
🇬🇧 UK          →  " UK"
🇳🇱 NETHERLANDS →  " NE"

## 🚀 **INICIO RÁPIDO**

### **Instalación (una vez):**
```bash
./instalar_mac.sh
```

### **Uso diario:**
```bash
./ejecutar_lebengood.sh
```

**¡Eso es todo!** Para más detalles, consulta `GUIA_ULTRA_SIMPLE.md`

---

## 📁 **SCRIPTS DISPONIBLES**

### 🏭 **LEBENGOOD Unificado (`lebengood_unified.py`) - RECOMENDADO**

**¡LA APLICACIÓN TODO-EN-UNO!** Combina todas las funcionalidades en una sola ventana con pestañas.

**Funcionalidades:**
- 🚀 **Pestaña 1: Renombrar Archivos** - Procesamiento completo para Amazon
- 📁 **Pestaña 2: Analizar Carpetas** - Exploración de estructura en Google Drive  
- 📸 **Pestaña 3: Reunir Fotos** - Recopilación de fotos existentes
- ⚙️ **Pestaña 4: Configuración** - Configuración de Google Drive API y ayuda

**Cómo usar:**
```bash
# Opción 1: Lanzador simple
./ejecutar_lebengood.sh

# Opción 2: Directo (con entorno virtual activado)
python lebengood_unified.py
```

**Ideal para:** Usuarios que quieren acceso a todas las funciones en una sola aplicación.

---

### 🚀 **Script Principal (`script.py`)**

**Procesador especializado para Amazon** con interfaz gráfica moderna.

**Funcionalidades:**
- ✨ **Renombrado masivo** con códigos B específicos para Amazon (B0CZTTFND6, B0CZTXFH9V, etc.)
- 🖼️ **Conversión automática PNG→JPG** con calidad optimizada (95%)
- 📁 **Procesamiento múltiple** de carpetas en una sola sesión
- 🎯 **Validación estricta** de archivos (.PT## y .MAIN solamente)
- ☁️ **Subida automática** a Google Drive con estructura organizada por país/artículo/color
- 📊 **Resumen detallado** del procesamiento con estadísticas

**Estructura esperada en Google Drive:**
```
LEBENGOOD/
└── FOTOS/
    └── FOTOS ORDENADAS/
        └── {PAÍS}/
            └── {ARTÍCULO}/
                ├── ROJO/
                ├── VERDE/
                └── AZUL/
```
**Como usar**
1. **Artículo:** Introduce el nombre (ej: ALBORNOZ), es el nomber de la carpeta del articulo creada en el DRIVE, pueden haber espacios
2. **Códigos:** Introduce códigos ASIN separados por comas (ej: B0CZTXFH9V, B0CZTTFND6, B0CZTVBDJV)
3. **Agregar Carpetas:** Selecciona carpetas locales con fotos, las carpetas tienen que tener la siguiente estructura (COLOR PAIS) -> (SHARKY ES)

**DETALLES NOMBRE FOTOS DENTRO DE LAS CARPETAS**
**Nombre:** El programa permite imagenes con la terminacion .MAIN y PT## (siendo #numero), el programa corrige las minusculas automaticamente y transforma a jpg
**Estructura:** foto1.PT01 -> B0989139.PT01, las fotos en las carpetas locales pueden llamarse como sea, da igual

**DETALLES DRIVE**
**Nombres:** Los nombres de las carpetas de colores tiene que estar TODO en mayusculas
**ESTRUCTURA:** La estructura tiene que seguir la que pone arriba
**ZIP:** Este script genera un zip del color dentro de la carpeta, no uno general, el especifico de la carpeta


**Validaciones automáticas:**
- Solo procesa archivos de imagen (.jpg, .png, .gif, .bmp, .tiff, .webp, .raw, etc.)
- Requiere archivos con terminación .PT## (2 dígitos) o .MAIN
- Convierte automáticamente nombres a mayúsculas si es necesario
- Valida que todos los códigos empiecen por 'B'

---
### 📁 **Analizador de Carpetas (`carpetas.py`)**

**Herramienta de análisis y creación** de estructuras de carpetas en Google Drive.

**Funcionalidades:**
- 🔍 **Exploración completa** de la estructura LEBENGOOD
- 📋 **Validación de nomenclatura** de carpetas y subcarpetas
- 🏗️ **Creación automática** de estructuras para nuevos productos
- 🌍 **Soporte multi-país** para productos internacionales
- 📊 **Reportes detallados** de la estructura existente


**COMO USAR:**
**NOMBRE CARPETA PRINCIPAL:** Aqui hay que introducir el nombre del articulo, que sera la carpeta principal, puede ser en mayusculas o minusculas ya que se transforma automaticamente a
mayusculas y puede haber espacios
**COLORES:** Introducir los colores uno por uno que hay , los que tengan espacios se transforman en _ y aunque esten en minusculas se pasan a mayusculas tambien
**PAISES:** Las carpetas se crean en los 4 paises por lo que no hay que seleccionar paises

**Colores predefinidos para ALBORNOZ INFANTIL:**
- CIELO, LIMA, MALVA, MELOCOTÓN, PERLA, ROSA, TURQUESA

**Estructura creada:**
```
LEBENGOOD/FOTOS/FOTOS ORDENADAS/
├── ESPAÑA/
│   └── {PRODUCTO}/
│       ├── {COLOR1}/
│       ├── {COLOR2}/
│       └── {COLOR3}/
├── ALEMANIA/
│   └── {PRODUCTO}/
│       └── (mismos colores)
└── FRANCIA/
    └── {PRODUCTO}/
        └── (mismos colores)
```

**Ideal para:** Configuración inicial de nuevos productos o validación de estructuras existentes.

-----
### 📸 **Recopilador de fotos con Interfaz (`interfaz.py`)**


**Funcionalidades:**
- 🔍 **Búsqueda recursiva automática** en todas las subcarpetas sin importar profundidad
- 📦 **Copia (no mueve)** - Las fotos originales permanecen intactas
- 🎯 **Detección automática** de múltiples formatos de imagen
- 📊 **Barra de progreso visual** en tiempo real
- 🧹 **Limpieza automática** de archivos temporales
- ☁️ **Subida automática** del ZIP creado a Google Drive


**En la interfaz:**
1. **País:** Introduce el país en MAYÚSCULAS (ej: ESPAÑA)
2. **Carpeta:** Introduce el nombre de la carpeta en MAYÚSCULAS (ej: ALBORNOZ)
3. **Ejecutar Proceso:** Inicia la recopilación automática

**Proceso automático:**
1. Navega a `LEBENGOOD/FOTOS/FOTOS ORDENADAS/{PAÍS}/{CARPETA}/`
2. Explora recursivamente todas las subcarpetas (ROJO, VERDE, AZUL, etc.)
3. Descarga todas las imágenes encontradas
4. Crea un archivo ZIP con el nombre de la carpeta
5. Sube el ZIP a la carpeta original en Google Drive
6. Limpia archivos temporales

**Ideal para:** Recopilar fotos existentes de Google Drive de forma organizada.

---
**FLUJO DE TRABAJO**

**CREAR CARPETAS**

📁 CREA:
LEBENGOOD/FOTOS/FOTOS ORDENADAS/
├── ESPAÑA/
│   └── [ARTÍCULO]/
│       ├── ROJO_FUEGO/     (vacía)
│       ├── AZUL_MARINO/    (vacía)  
│       └── VERDE_MENTA/    (vacía)
├── ALEMANIA/
│   └── [ARTÍCULO]/
│       └── ... (mismos colores, vacías)
└── ...otros países

✅ RESULTADO: Estructura completa lista para recibir archivos

**RENOMBRADOR DE FOTOS**
📝 PROPÓSITO: Procesar y subir fotos a las carpetas ya existentes

🔄 PROCESO:
- Toma carpetas locales (ej: "ROJO_FUEGO ES")
- Detecta país y color 
- Renombra archivos con códigos B
- Sube a la carpeta correspondiente ya creada

✅ RESULTADO: Carpetas pobladas con fotos renombradas

**REUNIDOR DE FOTOS PARA GENERAR EL ZIP**
📸 PROPÓSITO: Recopilar fotos de carpetas ya existentes y pobladas

🔄 PROCESO:  
- Busca en carpetas específicas que YA tienen contenido
- Descarga todas las fotos encontradas
- Crea ZIP con todas las fotos
- Sube el ZIP compilado

✅ RESULTADO: ZIP con fotos recopiladas de múltiples subcarpetas


### 📦 **Recopilador por Comandos (`reunir_fotos.py`)**

**Recopilador potente por línea de comandos** con procesamiento secuencial.

**Funcionalidades:**
- 🔄 **Procesamiento secuencial** carpeta por carpeta sin duplicaciones
- 🔍 **Búsqueda recursiva inteligente** en múltiples niveles
- 📊 **Estadísticas detalladas** de progreso y resultados
- 💾 **Gestión eficiente de memoria** procesando una carpeta a la vez
- 📦 **Creación automática de ZIP** optimizado

**Cómo usar:**
```bash
# Activar entorno virtual
source venv/bin/activate

# Ejecutar con parámetros
python reunir_fotos.py PAÍS CARPETA

# Ejemplo
python reunir_fotos.py ESPAÑA ALBORNOZ
```

**Algoritmo de procesamiento:**
1. **Navegación:** Encuentra la estructura `LEBENGOOD/FOTOS/FOTOS ORDENADAS/{PAÍS}/{CARPETA}/`
2. **Exploración secuencial:** Procesa cada subcarpeta principal (ROJO, VERDE, AZUL) una por una
3. **Búsqueda recursiva:** En cada subcarpeta, explora todos los niveles de profundidad
4. **Descarga inteligente:** Evita duplicados usando nombres de archivo únicos
5. **ZIP optimizado:** Crea archivo comprimido con todas las imágenes
6. **Subida automática:** Sube el ZIP a la carpeta original

**Ventajas del procesamiento secuencial:**
- Menor uso de memoria
- Sin duplicaciones
- Progreso claro carpeta por carpeta
- Recuperación fácil en caso de interrupciones

**Ideal para:** Automatización por scripts o procesamiento de carpetas específicas.

---


### 🔬 **Diagnóstico Avanzado (`diagnostico_carpetas.py`)**

**Herramienta de diagnóstico** para resolver problemas de configuración.

**Funcionalidades:**
- 🔐 **Verificación de autenticación** y permisos de cuenta
- 📊 **Análisis de carpetas raíz** en Google Drive
- 🔍 **Búsqueda específica** de la carpeta LEBENGOOD
- 📋 **Listado de subcarpetas** con metadatos detallados
- 🔄 **Búsqueda de variaciones** de nombres (mayúsculas/minúsculas)
- ⚠️ **Detección de problemas** comunes y sugerencias de solución

**Información proporcionada:**
- Email de la cuenta autenticada
- Nombre del usuario
- Lista completa de carpetas en la raíz
- Detalles de carpetas LEBENGOOD encontradas
- Fechas de creación y modificación
- Estructura de subcarpetas

**Cómo usar:**
```bash
# Activar entorno virtual
source venv/bin/activate

# Ejecutar diagnóstico
python diagnostico_carpetas.py
```

**Casos de uso:**
- Verificar configuración inicial
- Resolver problemas de permisos
- Encontrar carpetas con nombres incorrectos
- Diagnosticar problemas de acceso

**Ideal para:** Solución de problemas y verificación de configuración.

---

### 🔐 **Verificador de Conexión (`test_google_drive.py`)**

**Script de verificación** para comprobar la configuración de Google Drive API.

**Funcionalidades:**
- ✅ **Verificación de archivos** credentials.json y token.json
- 🔄 **Proceso de autenticación** OAuth 2.0 completo
- 🌐 **Prueba de conexión** con Google Drive API
- 🛠️ **Diagnóstico de errores** con soluciones específicas
- 📝 **Guía integrada** para resolver redirect_uri_mismatch
- 💾 **Gestión automática** de tokens de acceso

**Verificaciones realizadas:**
1. Existencia de credentials.json
2. Validez de tokens existentes
3. Proceso de renovación de tokens expirados
4. Autenticación OAuth completa si es necesario
5. Prueba de listado de archivos en Drive

**Cómo usar:**
```bash
# Activar entorno virtual
source venv/bin/activate

# Ejecutar verificación
python test_google_drive.py
```

**Soluciones automáticas para errores comunes:**
- **redirect_uri_mismatch:** Instrucciones paso a paso para configurar URIs
- **Token expirado:** Renovación automática
- **Credenciales inválidas:** Guía para regenerar credentials.json

**Ideal para:** Primera configuración y resolución de problemas de autenticación.

---

## 🔧 **CONFIGURACIÓN INICIAL**

### **1. Configurar Google Drive API**

1. **Crear proyecto en Google Cloud Console:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita la API de Google Drive

2. **Crear credenciales OAuth 2.0:**
   - Ve a "APIs y servicios" > "Credenciales"
   - Haz clic en "Crear credenciales" > "ID de cliente OAuth 2.0"
   - Selecciona "Aplicación de escritorio"
   - **IMPORTANTE:** En "URIs de redirección autorizados" agrega:
     - `http://localhost:8080/`
     - `http://localhost/`
     - `http://127.0.0.1:8080/`

3. **Configurar credenciales:**
   - Descarga el archivo JSON de credenciales
   - Renómbralo a `credentials.json`
   - Colócalo en el directorio del proyecto

### **2. Primera Autenticación**

La primera vez que ejecutes cualquier script, se abrirá tu navegador para autenticarte con Google Drive. Esto creará un archivo `token.json` para futuras ejecuciones.

---

## 🎯 **CASOS DE USO RECOMENDADOS**

### **Para Usuarios No Técnicos:**
```bash
./ejecutar_lebengood.sh
```
**→ Aplicación todo-en-uno con pestañas fáciles de usar**

### **Para Procesamiento Masivo de Amazon:**
```bash
python script.py
```
**→ Interfaz especializada para renombrado y conversión masiva**

### **Para Recopilar Fotos Existentes:**
```bash
python interfaz.py
```
**→ Interfaz gráfica para descargar y organizar fotos**

### **Para Automatización:**
```bash
python reunir_fotos.py ESPAÑA ALBORNOZ
```
**→ Procesamiento por comandos para scripts automatizados**

### **Para Configuración Inicial:**
```bash
python carpetas.py
```
**→ Crear estructuras de carpetas para nuevos productos**

### **Para Solución de Problemas:**
```bash
python test_google_drive.py
python diagnostico_carpetas.py
```
**→ Verificar configuración y diagnosticar problemas**

---

## 📊 **FORMATOS DE IMAGEN SOPORTADOS**

- **.jpg, .jpeg** - JPEG estándar
- **.png** - PNG (se convierte automáticamente a JPG)
- **.gif** - GIF animado y estático
- **.bmp** - Bitmap de Windows
- **.tiff** - TIFF sin compresión y comprimido
- **.webp** - WebP de Google
- **.raw** - RAW genérico
- **.cr2** - Canon RAW
- **.nef** - Nikon RAW
- **.arw** - Sony RAW
- **.dng** - Adobe Digital Negative

---

## ⚠️ **NOTAS IMPORTANTES**

### **Seguridad:**
- Nunca compartas tu archivo `credentials.json` o `token.json`
- Mantén actualizados los permisos OAuth en Google Cloud Console

### **Permisos:**
- Asegúrate de que tu cuenta tenga acceso de escritura a todas las carpetas mencionadas
- Verifica que la estructura LEBENGOOD existe en tu Google Drive

### **Rendimiento:**
- El procesamiento secuencial es más lento pero más estable
- Para carpetas muy grandes, usa `reunir_fotos.py` por comandos
- Mantén conexión estable a internet durante el procesamiento

### **Espacio:**
- Verifica que tengas suficiente espacio local para las descargas temporales
- Los archivos temporales se limpian automáticamente después del procesamiento

---

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **Error: "No se encontró la carpeta X"**
- Verifica que la jerarquía de carpetas coincida exactamente
- Los nombres deben estar en MAYÚSCULAS
- Asegúrate de tener permisos de acceso
- Usa `diagnostico_carpetas.py` para verificar la estructura

### **Error de autenticación**
- Ejecuta `python test_google_drive.py`
- Elimina `token.json` y vuelve a autenticarte si persiste
- Verifica que `credentials.json` esté en el directorio correcto
- Asegúrate de que la API de Drive esté habilitada

### **Error al descargar archivos**
- Verifica tu conexión a internet
- Algunos archivos pueden estar corruptos o tener permisos especiales
- Usa el procesamiento secuencial para mejor estabilidad

### **Error: "ModuleNotFoundError"**
- Asegúrate de tener el entorno virtual activado: `source venv/bin/activate`
- Reinstala dependencias: `pip install -r requirements.txt`
- Instala Pillow para conversión PNG: `pip install Pillow`

---

## 📞 **SOPORTE TÉCNICO**

Para problemas específicos, consulta:
- `SOLUCION_REDIRECT_URI.md` - Soluciones para errores OAuth
- `GUIA_ULTRA_SIMPLE.md` - Guía básica de 2 comandos
- Ejecuta `python test_google_drive.py` para diagnóstico automático

---

**¡Tu suite completa para procesamiento profesional de fotos para Amazon!** 🚀