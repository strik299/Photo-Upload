"""
Google Drive API service layer
"""
import os
import json
from pathlib import Path
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload, MediaIoBaseDownload
from utils.exceptions import AuthenticationError


SCOPES = ['https://www.googleapis.com/auth/drive']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'


class GoogleDriveService:
    """Handles all Google Drive API operations"""
    
    def __init__(self):
        """Initialize Google Drive service"""
        self.creds = None
        self.service = None
        
        # 1. Try Service Account (Preferred for Server)
        # Check env var first, then file
        try:
            env_creds = os.getenv('GOOGLE_CREDENTIALS_JSON')
            if env_creds:
                creds_dict = json.loads(env_creds)
                self.creds = service_account.Credentials.from_service_account_info(
                    creds_dict, scopes=SCOPES
                )
            elif os.path.exists('credentials.json'):
                # Try to load as Service Account first
                try:
                    self.creds = service_account.Credentials.from_service_account_file(
                        'credentials.json', scopes=SCOPES
                    )
                except ValueError:
                    # If it fails (missing fields), it's likely an OAuth Client ID file
                    # We will handle this in the fallback below
                    self.creds = None
        except Exception as e:
            print(f"Service Account load failed: {e}")
            self.creds = None

        # 2. Fallback to OAuth User Credentials (Local/Dev)
        if not self.creds:
            # Check for token in environment variable (Production/Render)
            env_token = os.getenv('GOOGLE_TOKEN_JSON')
            if env_token:
                try:
                    token_dict = json.loads(env_token)
                    self.creds = Credentials.from_authorized_user_info(token_dict, SCOPES)
                except Exception as e:
                    print(f"Error loading token from environment: {e}")

            # Check for existing token file (Local)
            if not self.creds and os.path.exists(TOKEN_FILE):
                try:
                    self.creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
                except Exception as e:
                    print(f"Token file invalid: {e}")
            
            # If no valid token, let user log in (if client secrets exist)
            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    try:
                        self.creds.refresh(Request())
                    except Exception:
                        self.creds = None
                
                if not self.creds and os.path.exists('credentials.json'):
                    try:
                        flow = InstalledAppFlow.from_client_secrets_file(
                            'credentials.json', SCOPES)
                        self.creds = flow.run_local_server(port=0)
                        # Save the credentials for the next run
                        with open(TOKEN_FILE, 'w') as token:
                            token.write(self.creds.to_json())
                    except Exception as e:
                        print(f"OAuth flow failed: {e}")

        if not self.creds:
             raise AuthenticationError("No se encontraron credenciales válidas (ni Service Account ni OAuth)")

        self.service = build('drive', 'v3', credentials=self.creds)
    
    def is_authenticated(self) -> bool:
        """Check if service is authenticated"""
        return self.service is not None
    
    def buscar_carpeta_por_nombre(self, nombre_carpeta: str, parent_folder_id: str = None) -> str:
        """Search for a folder by name and return its ID"""
        if not self.service:
            return None
        
        try:
            query = f"name='{nombre_carpeta}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
            if parent_folder_id:
                query += f" and '{parent_folder_id}' in parents"
            
            results = self.service.files().list(
                q=query,
                fields="files(id, name)"
            ).execute()
            
            items = results.get('files', [])
            if items:
                return items[0]['id']
            return None
        except Exception as e:
            print(f"Error buscando carpeta '{nombre_carpeta}': {e}")
            return None
    
    def crear_carpeta_drive(self, nombre_carpeta: str, parent_folder_id: str = None) -> str:
        """Create a folder in Google Drive and return its ID"""
        if not self.service:
            return None
        
        try:
            folder_metadata = {
                'name': nombre_carpeta,
                'mimeType': 'application/vnd.google-apps.folder',
            }
            
            if parent_folder_id:
                folder_metadata['parents'] = [parent_folder_id]
            
            folder = self.service.files().create(
                body=folder_metadata,
                fields='id'
            ).execute()
            
            return folder.get('id')
        except Exception as e:
            print(f"Error creating folder: {e}")
            return None
    
    def listar_carpetas_hijas(self, parent_folder_id: str) -> list:
        """List all subfolders of a parent folder"""
        if not self.service:
            return []
        
        try:
            query = f"'{parent_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
            
            results = self.service.files().list(
                q=query,
                fields="files(id, name)"
            ).execute()
            
            return results.get('files', [])
        except Exception as e:
            print(f"Error listing subfolders: {e}")
            return []
    
    def subir_archivo_drive(self, ruta_archivo: str, nombre_archivo: str, parent_folder_id: str = None) -> str:
        """Upload a file to Google Drive"""
        if not self.service:
            return None
        
        try:
            file_metadata = {'name': nombre_archivo}
            
            if parent_folder_id:
                file_metadata['parents'] = [parent_folder_id]
            
            media = MediaFileUpload(str(ruta_archivo), resumable=True)
            
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            
            return file.get('id')
        except Exception as e:
            import traceback
            print(f"❌ Error uploading {nombre_archivo}: {e}")
            traceback.print_exc()
            return None
    
    def subir_zip_desde_memoria(self, zip_buffer, nombre_zip: str, parent_folder_id: str = None) -> tuple:
        """Upload a ZIP file from memory to Google Drive"""
        if not self.service:
            return None, None
        
        try:
            file_metadata = {'name': nombre_zip}
            
            if parent_folder_id:
                file_metadata['parents'] = [parent_folder_id]
            
            media = MediaIoBaseUpload(
                zip_buffer,
                mimetype='application/zip',
                resumable=True
            )
            
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,webViewLink'
            ).execute()
            
            return file.get('id'), file.get('webViewLink')
        except Exception as e:
            print(f"Error uploading ZIP: {e}")
            return None, None
    
    def obtener_archivos_en_carpeta(self, folder_id: str) -> list:
        """Get all files in a folder"""
        if not self.service:
            return []
        
        query = f"parents in '{folder_id}'"
        results = self.service.files().list(q=query).execute()
        return results.get('files', [])
    
    def descargar_archivo(self, file_id: str, file_name: str, destination_path: str) -> bool:
        """Download a file from Drive"""
        if not self.service:
            return False
        
        try:
            request = self.service.files().get_media(fileId=file_id)
            file_path = os.path.join(destination_path, file_name)
            
            with open(file_path, 'wb') as file:
                downloader = MediaIoBaseDownload(file, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
            
            return True
        except Exception as e:
            print(f"Error downloading {file_name}: {e}")
            return False
    
    def logout(self):
        """Remove authentication token"""
        if os.path.exists(TOKEN_FILE):
            os.remove(TOKEN_FILE)
            self.service = None
            return True
        return False
    
    def navegar_y_crear_estructura(self, articulo: str, pais: str, color: str) -> str:
        """
        Navigate through LEBENGOOD/FOTOS/FOTOS ORDENADAS/{PAÍS}/{ARTÍCULO}/{COLOR}
        and create any missing folders, returns the final folder ID
        """
        if not self.service:
            return None
        
        # Navigation path
        ruta_navegacion = [
            ("LEBENGOOD", None),
            ("FOTOS", "LEBENGOOD"),
            ("FOTOS ORDENADAS", "FOTOS"),
            (pais, "FOTOS ORDENADAS"),
            (articulo, pais),
            (color, articulo)
        ]
        
        carpeta_actual_id = None
        
        for nombre_carpeta, padre in ruta_navegacion:
            # Search for folder
            parent_id = carpeta_actual_id if carpeta_actual_id else (
                self.buscar_carpeta_por_nombre(padre) if padre else None
            )
            
            carpeta_id = self.buscar_carpeta_por_nombre(nombre_carpeta, parent_id)
            
            # Create if doesn't exist
            if not carpeta_id:
                print(f"   📁 Creando carpeta '{nombre_carpeta}'...")
                carpeta_id = self.crear_carpeta_drive(nombre_carpeta, parent_id)
                if not carpeta_id:
                    print(f"   ❌ Error creando carpeta '{nombre_carpeta}'")
                    return None
            
            carpeta_actual_id = carpeta_id
            print(f"   ✅ Carpeta '{nombre_carpeta}' encontrada/creada")
        
        return carpeta_actual_id
    
    def subir_archivo(self, ruta_archivo: str, parent_folder_id: str = None) -> str:
        """Alias for subir_archivo_drive with automatic name extraction"""
        nombre_archivo = Path(ruta_archivo).name
        return self.subir_archivo_drive(ruta_archivo, nombre_archivo, parent_folder_id)

    def listar_archivos_recursivo(self, folder_id: str) -> list:
        """Recursively list all image files in a folder structure"""
        if not self.service:
            return []
        
        all_files = []
        
        try:
            # Get all items in current folder
            query = f"'{folder_id}' in parents and trashed=false"
            results = self.service.files().list(
                q=query,
                fields="files(id, name, mimeType)"
            ).execute()
            
            items = results.get('files', [])
            
            for item in items:
                if item['mimeType'] == 'application/vnd.google-apps.folder':
                    # Recursively search subfolders
                    subfolder_files = self.listar_archivos_recursivo(item['id'])
                    all_files.extend(subfolder_files)
                elif 'image/' in item['mimeType']:
                    # Add image files
                    all_files.append(item)
                    
            return all_files
            
        except Exception as e:
            print(f"Error listing files recursively: {e}")
            return []
