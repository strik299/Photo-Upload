"""
Utility helper functions for the LEBENGOOD application
"""
from pathlib import Path
import re


def es_imagen(nombre_archivo: str) -> bool:
    """Verifica si un archivo es una imagen basándose en su extensión"""
    extensiones_imagen = {
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', 
        '.webp', '.raw', '.cr2', '.nef', '.arw', '.dng', 
        '.svg', '.ico', '.jfif'
    }
    return Path(nombre_archivo).suffix.lower() in extensiones_imagen


def extraer_pais_de_ruta(ruta_carpeta: str) -> str:
    """Extrae el país de la ruta de la carpeta"""
    ruta_str = str(ruta_carpeta).upper()
    
    # Buscar terminaciones de país después de un espacio
    if " ES" in ruta_str:
        return "ESPAÑA"
    elif " DE" in ruta_str:
        return "ALEMANIA"
    elif " FR" in ruta_str:
        return "FRANCIA"
    elif " IT" in ruta_str:
        return "ITALIA"
    elif " UK" in ruta_str:
        return "UK"
    elif " NE" in ruta_str:
        return "NETHERLANDS"
    elif " PL" in ruta_str:
        return "POLONIA"
    elif " SE" in ruta_str:
        return "SUECIA"
    else:
        return None


def extraer_color_de_nombre(nombre_carpeta: str) -> str:
    """Extrae el color del nombre de la carpeta"""
    nombre_base = Path(nombre_carpeta).name
    
    # Patrones de país a eliminar
    patrones_pais = [" ES", " DE", " FR", " IT", " UK", " NE", " PL", " SE"]
    
    nombre_limpio = nombre_base.upper()
    
    # Eliminar sufijos de país si existen
    for patron in patrones_pais:
        if nombre_limpio.endswith(patron):
            nombre_limpio = nombre_limpio[:-len(patron)].strip()
            break
    
    return nombre_limpio


def transformar_nombre_carpeta(nombre_carpeta: str) -> str:
    """Transforma el nombre de la carpeta reemplazando espacios por _ excepto el último"""
    ultimo_espacio = nombre_carpeta.rfind(' ')
    
    if ultimo_espacio == -1:
        return nombre_carpeta
    
    parte_inicial = nombre_carpeta[:ultimo_espacio]
    parte_final = nombre_carpeta[ultimo_espacio:]
    
    parte_inicial_transformada = parte_inicial.replace(' ', '_')
    
    return parte_inicial_transformada + parte_final


def validar_formato_pt(nombre_archivo: str) -> bool:
    """Valida que los archivos .PT tengan exactamente 2 dígitos"""
    nombre_upper = nombre_archivo.upper()
    if '.PT' in nombre_upper:
        matches = re.finditer(r'\.PT([^.\s]*)', nombre_upper)
        for match in matches:
            sufijo = match.group(1)
            if not (sufijo and sufijo.isdigit() and len(sufijo) == 2):
                return False
    return True
