"""
File processing service for image conversion and file operations
"""
import shutil
import re
from pathlib import Path
from typing import List, Tuple

try:
    from PIL import Image
    PIL_DISPONIBLE = True
except ImportError:
    PIL_DISPONIBLE = False


class FileProcessor:
    """Handles file processing operations"""
    
    @staticmethod
    def convertir_png_a_jpg(ruta_png: Path, carpeta_destino: Path, calidad: int = 95) -> Path:
        """Convert PNG to JPG"""
        if not PIL_DISPONIBLE:
            print(f"❌ Cannot convert {ruta_png.name}: PIL not available")
            return None
        
        try:
            nombre_sin_extension = ruta_png.stem
            nombre_jpg = f"{nombre_sin_extension}.jpg"
            ruta_jpg = carpeta_destino / nombre_jpg
            
            with Image.open(ruta_png) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    fondo = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    fondo.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = fondo
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                img.save(ruta_jpg, 'JPEG', quality=calidad, optimize=True)
            
            print(f"   🔄 PNG→JPG: {ruta_png.name} → {nombre_jpg}")
            return ruta_jpg
            
        except Exception as e:
            print(f"   ❌ Error converting {ruta_png.name} to JPG: {e}")
            return None
    
    @staticmethod
    def procesar_archivos_con_conversion(
        archivos_originales: List[Path], 
        carpeta_temporal: Path, 
        lista_strings: List[str]
    ) -> Tuple[int, int]:
        """Process files with PNG to JPG conversion and renaming"""
        total_generadas = 0
        png_convertidos = 0
        
        archivos_a_procesar = {}
        
        # Convert PNGs if necessary
        for archivo in archivos_originales:
            if archivo.name.lower().endswith('.png'):
                archivo_convertido = FileProcessor.convertir_png_a_jpg(archivo, carpeta_temporal)
                if archivo_convertido:
                    png_convertidos += 1
                    archivos_a_procesar[archivo] = archivo_convertido
                    print(f"   ✅ PNG converted: {archivo.name} → {archivo_convertido.name}")
                else:
                    archivos_a_procesar[archivo] = archivo
            else:
                archivos_a_procesar[archivo] = archivo
        
        # Process each file with all codes
        for archivo_original, archivo_a_usar in archivos_a_procesar.items():
            nombre_archivo_base = archivo_a_usar.name
            primer_punto = nombre_archivo_base.find('.')
            
            if primer_punto == -1:
                extension = ""
            else:
                extension = nombre_archivo_base[primer_punto:]
            
            for string_nuevo in lista_strings:
                nuevo_nombre = f"{string_nuevo}{extension}"
                ruta_nueva = carpeta_temporal / nuevo_nombre
                
                try:
                    if archivo_a_usar.parent == carpeta_temporal:
                        if archivo_a_usar.exists():
                            if len(lista_strings) > 1:
                                shutil.copy2(archivo_a_usar, ruta_nueva)
                            else:
                                archivo_a_usar.rename(ruta_nueva)
                            total_generadas += 1
                        else:
                            print(f"   ⚠️ Converted file not found: {archivo_a_usar.name}")
                    else:
                        shutil.copy2(archivo_a_usar, ruta_nueva)
                        total_generadas += 1
                    
                except Exception as e:
                    print(f"   ❌ Error processing {archivo_original.name} → {nuevo_nombre}: {e}")
        
        # Clean up temporary converted files
        for archivo_original, archivo_usado in archivos_a_procesar.items():
            if (archivo_usado.parent == carpeta_temporal and 
                archivo_usado.exists() and 
                archivo_original.name.lower().endswith('.png')):
                try:
                    if len(lista_strings) > 1:
                        archivo_usado.unlink()
                except:
                    pass
        
        return total_generadas, png_convertidos
    
    @staticmethod
    def validar_archivos_imagen(carpeta: Path) -> Tuple[List[Path], List[str]]:
        """Validate and normalize image file names"""
        from utils.helpers import es_imagen
        
        archivos = [
            archivo for archivo in carpeta.iterdir() 
            if archivo.is_file() and es_imagen(archivo.name)
        ]
        
        archivos_invalidos = []
        archivos_renombrados = []
        
        for archivo in archivos:
            nombre_archivo = archivo.name
            nombre_upper = nombre_archivo.upper()
            
            if '.PT' not in nombre_upper and '.MAIN' not in nombre_upper:
                archivos_invalidos.append(archivo.name)
            else:
                nombre_corregido = nombre_archivo
                nombre_corregido = re.sub(r'\.pt(\d*)', r'.PT\1', nombre_corregido, flags=re.IGNORECASE)
                nombre_corregido = re.sub(r'\.main', r'.MAIN', nombre_corregido, flags=re.IGNORECASE)
                
                if nombre_corregido != nombre_archivo:
                    try:
                        nueva_ruta = archivo.parent / nombre_corregido
                        archivo.rename(nueva_ruta)
                        archivos_renombrados.append(f"{nombre_archivo} → {nombre_corregido}")
                        print(f"   ✅ Renamed: {nombre_archivo} → {nombre_corregido}")
                    except Exception as e:
                        print(f"   ❌ Error renaming {nombre_archivo}: {e}")
        
        # Refresh file list after renaming
        if archivos_renombrados:
            archivos = [archivo for archivo in carpeta.iterdir() if archivo.is_file()]
        
        return archivos, archivos_invalidos, archivos_renombrados
    
    def __init__(self, google_drive_service):
        """Initialize with Google Drive service"""
        self.drive_service = google_drive_service
    
    def process_folder(self, carpeta_path: str, articulo: str, lista_codigos: List[str], broadcast_callback=None, loop=None) -> dict:
        """
        Process a folder with file renaming and upload to Google Drive
        Replicates the logic from the original tkinter script
        """
        from utils.helpers import extraer_pais_de_ruta, extraer_color_de_nombre, transformar_nombre_carpeta, validar_formato_pt
        import tempfile
        import asyncio
        
        carpeta = Path(carpeta_path)
        carpeta_nombre = carpeta.name
        
        def log(message):
            """Helper to log messages"""
            print(message)
            if broadcast_callback and loop:
                try:
                    asyncio.run_coroutine_threadsafe(broadcast_callback(message), loop)
                except Exception as e:
                    print(f"Error broadcasting message: {e}")
        
        if not carpeta.exists():
            return {'carpeta': carpeta_nombre, 'exito': False, 'error': f"La carpeta '{carpeta_path}' no existe"}
        
        # Validate and get image files
        log(f"   🔍 Validando archivos...")
        archivos, archivos_invalidos, archivos_renombrados = self.validar_archivos_imagen(carpeta)
        
        if archivos_renombrados:
            log(f"   🔄 {len(archivos_renombrados)} archivos renombrados a mayúsculas")
        
        if archivos_invalidos:
            return {'carpeta': carpeta_nombre, 'exito': False, 'error': f"Archivos sin terminación correcta: {', '.join(archivos_invalidos)}"}
        
        if not archivos:
            return {'carpeta': carpeta_nombre, 'exito': False, 'error': "No se encontraron archivos de imagen"}
        
        log(f"   🖼️ Encontradas {len(archivos)} imágenes válidas")
        
        # Validate .PT format
        archivos_pt_invalidos = []
        for archivo in archivos:
            if not validar_formato_pt(archivo.name):
                archivos_pt_invalidos.append(archivo.name)
        
        if archivos_pt_invalidos:
            return {'carpeta': carpeta_nombre, 'exito': False, 'error': f"Formato .PT incorrecto: {', '.join(archivos_pt_invalidos)}"}
        
        # Extract country and color
        pais = extraer_pais_de_ruta(carpeta_path)
        if not pais:
            return {'carpeta': carpeta_nombre, 'exito': False, 'error': "No se pudo determinar el país de la ruta"}
        
        nombre_carpeta_transformado = transformar_nombre_carpeta(carpeta.name)
        color = extraer_color_de_nombre(nombre_carpeta_transformado)
        if not color:
            return {'carpeta': carpeta_nombre, 'exito': False, 'error': "No se pudo extraer el color del nombre de la carpeta"}
        
        log(f"   📋 Artículo: {articulo} | País: {pais} | Color: {color}")
        
        # Navigate to Drive folder structure
        log(f"   🔍 Navegando estructura en Google Drive...")
        carpeta_destino_id = self.drive_service.navegar_y_crear_estructura(articulo, pais, color)
        if not carpeta_destino_id:
            return {'carpeta': carpeta_nombre, 'exito': False, 'error': "No se encontró/creó la estructura en Google Drive"}
        
        # Process files in temp directory
        with tempfile.TemporaryDirectory() as temp_dir:
            carpeta_temporal = Path(temp_dir) / f"{articulo}_{carpeta.name}"
            carpeta_temporal.mkdir(exist_ok=True)
            
            log(f"   📁 Procesando archivos...")
            total_generadas, png_convertidos = self.procesar_archivos_con_conversion(
                archivos, carpeta_temporal, lista_codigos
            )
            
            if png_convertidos > 0:
                log(f"   🔄 Convertidos {png_convertidos} archivos PNG a JPG")
            
            log(f"   ✅ Generados {total_generadas} archivos")
            
            # Upload files to Google Drive
            log(f"   ☁️ Subiendo archivos a Google Drive...")
            archivos_procesados = list(carpeta_temporal.iterdir())
            archivos_subidos = 0
            
            for archivo_procesado in archivos_procesados:
                if archivo_procesado.is_file():
                    try:
                        file_id = self.drive_service.subir_archivo(str(archivo_procesado), carpeta_destino_id)
                        if file_id:
                            archivos_subidos += 1
                            log(f"   ✅ Subido: {archivo_procesado.name} (ID: {file_id})")
                        else:
                            log(f"   ❌ Falló subida: {archivo_procesado.name} (No ID returned)")
                    except Exception as e:
                        log(f"   ❌ Error subiendo {archivo_procesado.name}: {e}")
            
            log(f"   ✅ {archivos_subidos}/{len(archivos_procesados)} archivos subidos a Google Drive")
            
            # Create and upload ZIP
            try:
                log(f"   📦 Creando archivo ZIP...")
                zip_path = shutil.make_archive(
                    str(carpeta_temporal),
                    'zip',
                    str(carpeta_temporal)
                )
                
                log(f"   ☁️ Subiendo ZIP a Google Drive...")
                self.drive_service.subir_archivo(zip_path, carpeta_destino_id)
                log(f"   ✅ ZIP subido exitosamente")
                
            except Exception as e:
                log(f"   ❌ Error procesando ZIP: {e}")
            
            return {
                'carpeta': carpeta_nombre,
                'exito': True,
                'archivos_procesados': total_generadas,
                'archivos_subidos': archivos_subidos,
                'png_convertidos': png_convertidos
            }
