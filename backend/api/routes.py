"""
API routes for the LEBENGOOD application
"""
from fastapi import APIRouter, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional
import json
import asyncio
import tempfile
import shutil
import zipfile
import io
from pathlib import Path

from services.google_drive import GoogleDriveService
from services.file_processor import FileProcessor
from auth import security
from utils.helpers import (
    es_imagen, extraer_pais_de_ruta, extraer_color_de_nombre,
    transformar_nombre_carpeta, validar_formato_pt
)
from utils.exceptions import (
    ValidationError, AuthenticationError, DriveServiceError,
    FileProcessingError, FolderNotFoundError
)

# Protect all routes in this router
router = APIRouter(dependencies=[Depends(security.get_current_active_user)])
ws_router = APIRouter()

# Global drive service instance
drive_service = None

# WebSocket connections
active_connections: List[WebSocket] = []


async def broadcast_message(message: str):
    """Broadcast message to all connected WebSocket clients"""
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except:
            pass


@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time logging"""
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)


@router.get("/auth/status")
async def auth_status():
    """Check authentication status"""
    global drive_service
    
    try:
        if drive_service is None:
            drive_service = GoogleDriveService()
        
        is_auth = drive_service.is_authenticated()
        return {"authenticated": is_auth}
    except Exception as e:
        return {"authenticated": False, "error": str(e)}


@router.post("/auth/logout")
async def logout():
    """Logout and clear credentials"""
    global drive_service
    
    try:
        if drive_service:
            success = drive_service.logout()
            drive_service = None
            return {"success": success, "message": "Sesión cerrada"}
        return {"success": False, "message": "No hay sesión activa"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rename/preview")
async def preview_rename(
    articulo: str = Form(...),
    codigos: str = Form(...),
    folders: List[UploadFile] = File(...)
):
    """Preview file renaming without processing - validates and analyzes files"""
    try:
        # Parse codes
        lista_codigos = [c.strip().upper() for c in codigos.split(",") if c.strip()]
        
        # Validate codes start with 'B'
        codigos_validos = [c for c in lista_codigos if c.startswith('B')]
        codigos_invalidos = [c for c in lista_codigos if not c.startswith('B')]
        
        articulo_upper = articulo.upper().strip()
        
        # Group files by folder based on their relative path
        folders_dict = {}
        for uploaded_file in folders:
            file_path = uploaded_file.filename
            parts = file_path.split('/')
            if len(parts) > 1:
                folder_name = parts[0]
                if folder_name not in folders_dict:
                    folders_dict[folder_name] = []
                folders_dict[folder_name].append(uploaded_file)
        
        if not folders_dict:
            raise ValidationError("No se encontraron carpetas válidas para procesar")
        
        # Analyze each folder
        folder_analyses = []
        
        for folder_name, files in folders_dict.items():
            # Extract country and color
            pais = extraer_pais_de_ruta(folder_name)
            nombre_transformado = transformar_nombre_carpeta(folder_name)
            color = extraer_color_de_nombre(nombre_transformado)
            
            valid_files = []
            invalid_files = []
            png_count = 0
            
            for file in files:
                file_name = file.filename.split('/')[-1] if '/' in file.filename else file.filename
                
                # Skip system files and hidden files
                system_files = {'.DS_Store', 'Thumbs.db', 'desktop.ini', '.localized'}
                if file_name in system_files or file_name.startswith('._') or file_name.startswith('.'):
                    continue
                
                # Check if it's an image
                if not es_imagen(file_name):
                    invalid_files.append({
                        "name": file_name,
                        "reason": "No es un archivo de imagen"
                    })
                    continue
                
                # Check .PT format
                if not validar_formato_pt(file_name):
                    invalid_files.append({
                        "name": file_name,
                        "reason": "Formato .PT incorrecto (debe tener exactamente 2 dígitos, ej: .PT01)"
                    })
                    continue
                
                # Check for .PT or .MAIN
                file_upper = file_name.upper()
                if '.PT' not in file_upper and '.MAIN' not in file_upper:
                    invalid_files.append({
                        "name": file_name,
                        "reason": "Debe contener .PT o .MAIN en el nombre"
                    })
                    continue
                
                # File is valid
                valid_files.append(file_name)
                if file_name.lower().endswith('.png'):
                    png_count += 1
            
            folder_analyses.append({
                "name": folder_name,
                "detected_country": pais,
                "detected_color": color,
                "files": {
                    "valid": valid_files,
                    "invalid": invalid_files
                },
                "stats": {
                    "total": len(files),
                    "valid": len(valid_files),
                    "invalid": len(invalid_files),
                    "pngs_to_convert": png_count
                }
            })
        
        # Calculate summary
        total_files = sum(f["stats"]["total"] for f in folder_analyses)
        total_valid = sum(f["stats"]["valid"] for f in folder_analyses)
        total_invalid = sum(f["stats"]["invalid"] for f in folder_analyses)
        total_pngs = sum(f["stats"]["pngs_to_convert"] for f in folder_analyses)
        
        return {
            "success": True,
            "folders": folder_analyses,
            "codes_validation": {
                "valid": codigos_validos,
                "invalid": codigos_invalidos
            },
            "summary": {
                "total_folders": len(folder_analyses),
                "total_files": total_files,
                "total_valid": total_valid,
                "total_invalid": total_invalid,
                "total_pngs_to_convert": total_pngs
            }
        }
        
    except ValidationError:
        raise
    except Exception as e:
        error_msg = f"Error analizando archivos: {str(e)}"
        raise FileProcessingError(error_msg)


@router.post("/rename/process")
async def process_rename(
    articulo: str = Form(...),
    codigos: str = Form(...),
    folders: List[UploadFile] = File(...),
    only_images: str = Form(default="false")
):
    """Process file renaming with folder uploads"""
    global drive_service
    
    try:
        if not drive_service:
            drive_service = GoogleDriveService()
        
        only_images_flag = only_images.lower() == "true"
        
        if only_images_flag:
            await broadcast_message("🚀 Iniciando procesamiento (solo fotos)...")
        else:
            await broadcast_message("🚀 Iniciando procesamiento...")
        
        # Parse codes
        lista_codigos = [c.strip().upper() for c in codigos.split(",") if c.strip()]
        
        # Validate codes start with 'B'
        codigos_invalidos = [c for c in lista_codigos if not c.startswith('B')]
        if codigos_invalidos:
            error_msg = f"Códigos inválidos (deben empezar por 'B'): {', '.join(codigos_invalidos)}"
            await broadcast_message(f"❌ {error_msg}")
            raise ValidationError(error_msg, {"invalid_codes": codigos_invalidos})
        
        articulo_upper = articulo.upper().strip()
        
        # Group files by folder based on their relative path
        folders_dict = {}
        for uploaded_file in folders:
            # Get the relative path to determine folder structure
            file_path = uploaded_file.filename
            # Extract folder name (first part of the path)
            parts = file_path.split('/')
            if len(parts) > 1:
                folder_name = parts[0]
                if folder_name not in folders_dict:
                    folders_dict[folder_name] = []
                folders_dict[folder_name].append(uploaded_file)
        
        if not folders_dict:
            raise ValidationError("No se encontraron carpetas válidas para procesar")
        
        results = []
        total_carpetas = len(folders_dict)
        
        await broadcast_message(f"\n📦 Procesando {total_carpetas} carpetas...")
        
        # Process each folder
        for i, (folder_name, files) in enumerate(folders_dict.items(), 1):
            await broadcast_message(f"\n📁 [{i}/{total_carpetas}] Procesando: {folder_name}")
            
            try:
                # Create temp directory for this folder
                with tempfile.TemporaryDirectory() as temp_dir:
                    folder_path = Path(temp_dir) / folder_name
                    folder_path.mkdir(parents=True, exist_ok=True)
                    
                    # Save all files to temp folder
                    files_saved = 0
                    files_skipped = 0
                    
                    for file in files:
                        # Get the relative path and recreate structure
                        rel_path = file.filename
                        file_name = rel_path.split('/')[-1] if '/' in rel_path else rel_path
                        
                        # Skip system files and hidden files
                        system_files = {'.DS_Store', 'Thumbs.db', 'desktop.ini', '.localized'}
                        if file_name in system_files or file_name.startswith('._') or file_name.startswith('.'):
                            continue
                        
                        # If only_images flag is set, skip non-image files
                        if only_images_flag and not es_imagen(file_name):
                            files_skipped += 1
                            continue
                        
                        # Save file
                        file_path = folder_path / file_name
                        content = await file.read()
                        file_path.write_bytes(content)
                        files_saved += 1
                        # Reset file pointer for potential reuse
                        await file.seek(0)
                    
                    if only_images_flag and files_skipped > 0:
                        await broadcast_message(f"   ⏭️ {files_skipped} archivos no-imagen omitidos")
                    
                    await broadcast_message(f"   💾 {files_saved} archivos guardados")
                    
                    # Use FileProcessor to process this folder
                    processor = FileProcessor(drive_service)
                    result = await asyncio.to_thread(
                        processor.process_folder,
                        str(folder_path),
                        articulo_upper,
                        lista_codigos,
                        broadcast_message
                    )
                    
                    results.append(result)
                    
                    if result.get('exito'):
                        await broadcast_message(f"   ✅ Carpeta procesada exitosamente")
                    else:
                        error = result.get('error', 'Error desconocido')
                        await broadcast_message(f"   ❌ Error: {error}")
                        
            except Exception as e:
                error_msg = str(e)
                await broadcast_message(f"   ❌ Error procesando carpeta: {error_msg}")
                results.append({
                    'carpeta': folder_name,
                    'exito': False,
                    'error': error_msg
                })
        
        # Summary
        exitosas = len([r for r in results if r.get('exito')])
        await broadcast_message(f"\n✅ Completado: {exitosas}/{total_carpetas} carpetas procesadas exitosamente")
        
        return {
            "success": True,
            "results": results,
            "total": total_carpetas,
            "exitosas": exitosas
        }
        
    except ValidationError:
        raise
    except Exception as e:
        error_msg = f"Error procesando archivos: {str(e)}"
        await broadcast_message(f"❌ {error_msg}")
        raise FileProcessingError(error_msg)


@router.get("/folders/countries")
async def get_countries():
    """Get list of available countries"""
    global drive_service
    
    try:
        if not drive_service:
            drive_service = GoogleDriveService()
            
        # Navigate to LEBENGOOD/FOTOS/FOTOS ORDENADAS
        lebengood_id = drive_service.buscar_carpeta_por_nombre("LEBENGOOD")
        if not lebengood_id:
            raise FolderNotFoundError("LEBENGOOD")
        
        fotos_id = drive_service.buscar_carpeta_por_nombre("FOTOS", lebengood_id)
        if not fotos_id:
            raise FolderNotFoundError("FOTOS", "LEBENGOOD")
        
        fotos_ordenadas_id = drive_service.buscar_carpeta_por_nombre("FOTOS ORDENADAS", fotos_id)
        if not fotos_ordenadas_id:
            raise FolderNotFoundError("FOTOS ORDENADAS", "LEBENGOOD/FOTOS")
        
        # Get all countries
        paises = drive_service.listar_carpetas_hijas(fotos_ordenadas_id)
        
        return {
            "success": True,
            "countries": sorted([p['name'] for p in paises])
        }
        
    except Exception as e:
        import traceback
        print(f"❌ Error in get_countries: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/folders/create")
async def create_folders(
    nombre_carpeta: str = Form(...),
    paises: str = Form(...)
):
    """Create folder structure in Google Drive"""
    global drive_service
    
    try:
        if not drive_service:
            drive_service = GoogleDriveService()
        
        await broadcast_message("🚀 Iniciando creación de estructura...")
        
        nombre_carpeta_upper = nombre_carpeta.upper().strip()
        lista_paises = [p.strip() for p in paises.split(",") if p.strip()]
        
        await broadcast_message(f"📁 Carpeta: {nombre_carpeta_upper}")
        await broadcast_message(f"🌍 Países seleccionados: {len(lista_paises)}")
        
        # Navigate to LEBENGOOD/FOTOS/FOTOS ORDENADAS
        await broadcast_message("\n🔍 Navegando estructura...")
        lebengood_id = drive_service.buscar_carpeta_por_nombre("LEBENGOOD")
        if not lebengood_id:
            raise FolderNotFoundError("LEBENGOOD")
        
        fotos_id = drive_service.buscar_carpeta_por_nombre("FOTOS", lebengood_id)
        if not fotos_id:
            raise FolderNotFoundError("FOTOS", "LEBENGOOD")
        
        fotos_ordenadas_id = drive_service.buscar_carpeta_por_nombre("FOTOS ORDENADAS", fotos_id)
        if not fotos_ordenadas_id:
            raise FolderNotFoundError("FOTOS ORDENADAS", "LEBENGOOD/FOTOS")
        
        # Get all available countries to map names to IDs
        all_paises = drive_service.listar_carpetas_hijas(fotos_ordenadas_id)
        paises_map = {p['name']: p['id'] for p in all_paises}
        
        total_creadas = 0
        paises_procesados = 0
        
        # Create structure in selected countries
        for i, pais_nombre in enumerate(lista_paises, 1):
            if pais_nombre not in paises_map:
                await broadcast_message(f"\n⚠️ País no encontrado: {pais_nombre}")
                continue
                
            pais_id = paises_map[pais_nombre]
            await broadcast_message(f"\n[{i}/{len(lista_paises)}] 🇪🇸 {pais_nombre}")
            
            # Create or find main folder
            carpeta_id = drive_service.buscar_carpeta_por_nombre(nombre_carpeta_upper, pais_id)
            if not carpeta_id:
                carpeta_id = drive_service.crear_carpeta_drive(nombre_carpeta_upper, pais_id)
                await broadcast_message(f"   📁 Carpeta '{nombre_carpeta_upper}' creada")
                total_creadas += 1
            else:
                await broadcast_message(f"   ✅ Carpeta '{nombre_carpeta_upper}' ya existe")
            
            paises_procesados += 1
        
        await broadcast_message(f"\n🎉 ¡Completado! {total_creadas} carpetas creadas")
        
        return {
            "success": True,
            "paises_procesados": paises_procesados,
            "total_carpetas": total_creadas
        }
        
    except (ValidationError, FolderNotFoundError):
        raise
    except Exception as e:
        error_msg = f"Error creando estructura: {str(e)}"
        await broadcast_message(f"❌ {error_msg}")
        raise DriveServiceError(error_msg)


@router.post("/photos/gather")
async def gather_photos(
    pais: str = Form(...),
    carpeta: str = Form(...)
):
    """Gather photos from Google Drive folder"""
    global drive_service
    
    try:
        if not drive_service:
            drive_service = GoogleDriveService()
        
        pais_upper = pais.upper().strip()
        carpeta_upper = carpeta.upper().strip()
        
        await broadcast_message(f"🌍 Procesando: {pais_upper} → {carpeta_upper}")
        
        # Navigate structure
        await broadcast_message("\n📁 Navegando jerarquía...")
        lebengood_id = drive_service.buscar_carpeta_por_nombre('LEBENGOOD')
        if not lebengood_id:
            raise FolderNotFoundError('LEBENGOOD')
        await broadcast_message("✓ LEBENGOOD")
        
        fotos_id = drive_service.buscar_carpeta_por_nombre('FOTOS', lebengood_id)
        if not fotos_id:
            raise FolderNotFoundError('FOTOS', 'LEBENGOOD')
        await broadcast_message("✓ FOTOS")
        
        fotos_ordenadas_id = drive_service.buscar_carpeta_por_nombre('FOTOS ORDENADAS', fotos_id)
        if not fotos_ordenadas_id:
            raise FolderNotFoundError('FOTOS ORDENADAS', 'LEBENGOOD/FOTOS')
        await broadcast_message("✓ FOTOS ORDENADAS")
        
        pais_id = drive_service.buscar_carpeta_por_nombre(pais_upper, fotos_ordenadas_id)
        if not pais_id:
            raise FolderNotFoundError(pais_upper, 'FOTOS ORDENADAS')
        await broadcast_message(f"✓ {pais_upper}")
        
        carpeta_id = drive_service.buscar_carpeta_por_nombre(carpeta_upper, pais_id)
        if not carpeta_id:
            raise FolderNotFoundError(carpeta_upper, f'{pais_upper}')
        await broadcast_message(f"✓ {carpeta_upper}")
        
        # Create local ZIP folder
        carpeta_zip_local = Path("ZIP_TEMP")
        if carpeta_zip_local.exists():
            shutil.rmtree(carpeta_zip_local)
        carpeta_zip_local.mkdir(parents=True, exist_ok=True)
        
        await broadcast_message("\n🔍 Buscando fotos...")
        
        # 1. Find all images recursively
        files = await asyncio.to_thread(drive_service.listar_archivos_recursivo, carpeta_id)
        
        if not files:
            await broadcast_message("⚠️ No se encontraron fotos en esta carpeta")
            return {"success": False, "message": "No se encontraron fotos"}
            
        await broadcast_message(f"📸 Se encontraron {len(files)} fotos")
        
        # 2. Download files
        downloaded_files = []
        for i, file in enumerate(files, 1):
            await broadcast_message(f"⬇️ Descargando [{i}/{len(files)}]: {file['name']}")
            
            success = await asyncio.to_thread(
                drive_service.descargar_archivo,
                file['id'],
                file['name'],
                str(carpeta_zip_local)
            )
            
            if success:
                downloaded_files.append(file['name'])
        
        if not downloaded_files:
            raise FileProcessingError("No se pudo descargar ninguna foto")
            
        # 3. Create ZIP
        await broadcast_message("\n📦 Creando archivo ZIP...")
        zip_filename = f"{carpeta_upper}.zip"
        zip_path = carpeta_zip_local / zip_filename
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_name in downloaded_files:
                file_path = carpeta_zip_local / file_name
                zipf.write(file_path, file_name)
        
        # 4. Upload ZIP
        await broadcast_message("⬆️ Subiendo ZIP a Drive...")
        
        # Check if ZIP already exists and delete it (optional, to avoid duplicates)
        existing_zip_id = drive_service.buscar_carpeta_por_nombre(zip_filename, carpeta_id)
        # Note: buscar_carpeta_por_nombre searches for folders, we might need a file search
        # For now, just upload a new one
        
        zip_id = await asyncio.to_thread(
            drive_service.subir_archivo,
            str(zip_path),
            carpeta_id
        )
        
        if zip_id:
            await broadcast_message("✅ ZIP subido exitosamente")
        else:
            raise DriveServiceError("Error al subir el archivo ZIP")
            
        # Cleanup
        shutil.rmtree(carpeta_zip_local)
        
        await broadcast_message("🎉 Proceso completado")
        
        return {"success": True, "message": "Fotos reunidas exitosamente"}
        
    except FolderNotFoundError:
        raise
    except Exception as e:
        error_msg = f"Error reuniendo fotos: {str(e)}"
        await broadcast_message(f"❌ {error_msg}")
        raise DriveServiceError(error_msg)


@router.get("/config/info")
async def get_config_info():
    """Get system configuration information"""
    import os
    
    try:
        from PIL import Image
        pil_available = True
    except ImportError:
        pil_available = False
    
    credentials_exist = os.path.exists('credentials.json')
    token_exist = os.path.exists('token.json')
    
    return {
        "pil_available": pil_available,
        "credentials_exist": credentials_exist,
        "token_exist": token_exist
    }
