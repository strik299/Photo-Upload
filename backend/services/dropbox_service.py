"""
Dropbox API service layer
"""
import os
from pathlib import Path
from io import BytesIO
import dropbox
from dropbox.exceptions import ApiError, AuthError
from dropbox.files import WriteMode, FolderMetadata, FileMetadata


class DropboxService:
    """Handles all Dropbox API operations"""
    
    def __init__(self, access_token=None):
        """
        Initialize Dropbox service
        
        Args:
            access_token: OAuth2 access token for Dropbox API
        """
        self.dbx = dropbox.Dropbox(access_token) if access_token else None
    
    def is_authenticated(self) -> bool:
        """Check if service is authenticated"""
        if not self.dbx:
            return False
        
        try:
            self.dbx.users_get_current_account()
            return True
        except AuthError:
            return False
    
    def get_account_info(self) -> dict:
        """Get current user's account information"""
        if not self.dbx:
            return None
        
        try:
            account = self.dbx.users_get_current_account()
            return {
                'account_id': account.account_id,
                'email': account.email,
                'name': account.name.display_name,
                'country': account.country
            }
        except ApiError as e:
            print(f"Error getting account info: {e}")
            return None
    
    def create_folder(self, path: str) -> bool:
        """
        Create a folder in Dropbox
        
        Args:
            path: Full path of the folder to create (e.g., '/LEBENGOOD/FOTOS')
        
        Returns:
            True if folder was created or already exists, False on error
        """
        if not self.dbx:
            return False
        
        # Ensure path starts with /
        if not path.startswith('/'):
            path = '/' + path
        
        try:
            self.dbx.files_create_folder_v2(path)
            print(f"✅ Carpeta creada: {path}")
            return True
        except ApiError as e:
            if e.error.is_path() and e.error.get_path().is_conflict():
                # Folder already exists
                print(f"✅ Carpeta ya existe: {path}")
                return True
            print(f"❌ Error creando carpeta '{path}': {e}")
            return False
    
    def create_folder_structure(self, path: str) -> bool:
        """
        Create a nested folder structure, creating parent folders as needed
        
        Args:
            path: Full path like '/LEBENGOOD/FOTOS/FOTOS ORDENADAS/ESPAÑA'
        
        Returns:
            True if all folders were created successfully
        """
        if not self.dbx:
            return False
        
        # Ensure path starts with /
        if not path.startswith('/'):
            path = '/' + path
        
        # Split path and create each level
        parts = [p for p in path.split('/') if p]
        current_path = ''
        
        for part in parts:
            current_path += '/' + part
            if not self.create_folder(current_path):
                return False
        
        return True
    
    def upload_file(self, file_path: str, dropbox_path: str) -> str:
        """
        Upload a file to Dropbox
        
        Args:
            file_path: Local path to the file
            dropbox_path: Destination path in Dropbox (e.g., '/FOTOS/image.jpg')
        
        Returns:
            File ID if successful, None on error
        """
        if not self.dbx:
            return None
        
        # Ensure dropbox_path starts with /
        if not dropbox_path.startswith('/'):
            dropbox_path = '/' + dropbox_path
        
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
                
            result = self.dbx.files_upload(
                file_data,
                dropbox_path,
                mode=WriteMode.overwrite
            )
            
            print(f"✅ Archivo subido: {dropbox_path}")
            return result.id
        except ApiError as e:
            print(f"❌ Error subiendo archivo '{file_path}': {e}")
            return None
        except FileNotFoundError:
            print(f"❌ Archivo no encontrado: {file_path}")
            return None
    
    def upload_file_from_memory(self, file_data: bytes, dropbox_path: str, 
                                filename: str = None) -> tuple:
        """
        Upload a file from memory (BytesIO) to Dropbox
        
        Args:
            file_data: File data as bytes or BytesIO
            dropbox_path: Destination folder path in Dropbox
            filename: Name for the file
        
        Returns:
            Tuple of (file_id, share_link) if successful, (None, None) on error
        """
        if not self.dbx:
            return None, None
        
        # Ensure dropbox_path starts with /
        if not dropbox_path.startswith('/'):
            dropbox_path = '/' + dropbox_path
        
        # Add filename to path
        if filename:
            if not dropbox_path.endswith('/'):
                dropbox_path += '/'
            dropbox_path += filename
        
        try:
            # Convert BytesIO to bytes if needed
            if isinstance(file_data, BytesIO):
                file_data = file_data.getvalue()
            
            result = self.dbx.files_upload(
                file_data,
                dropbox_path,
                mode=WriteMode.overwrite
            )
            
            # Try to create a shared link
            share_link = self.create_shared_link(dropbox_path)
            
            print(f"✅ Archivo subido desde memoria: {dropbox_path}")
            return result.id, share_link
        except ApiError as e:
            print(f"❌ Error subiendo archivo desde memoria: {e}")
            return None, None
    
    def list_folder(self, path: str = '') -> list:
        """
        List contents of a folder
        
        Args:
            path: Folder path (empty string for root)
        
        Returns:
            List of file/folder metadata dictionaries
        """
        if not self.dbx:
            return []
        
        # Ensure path starts with / (except for root)
        if path and not path.startswith('/'):
            path = '/' + path
        
        try:
            result = self.dbx.files_list_folder(path)
            items = []
            
            for entry in result.entries:
                item = {
                    'name': entry.name,
                    'path': entry.path_display,
                    'is_folder': isinstance(entry, FolderMetadata)
                }
                
                if isinstance(entry, FileMetadata):
                    item['size'] = entry.size
                    item['modified'] = entry.client_modified.isoformat()
                
                items.append(item)
            
            return items
        except ApiError as e:
            print(f"❌ Error listando carpeta '{path}': {e}")
            return []
    
    def download_file(self, dropbox_path: str, local_path: str) -> bool:
        """
        Download a file from Dropbox
        
        Args:
            dropbox_path: Path in Dropbox
            local_path: Local destination path
        
        Returns:
            True if successful, False on error
        """
        if not self.dbx:
            return False
        
        # Ensure dropbox_path starts with /
        if not dropbox_path.startswith('/'):
            dropbox_path = '/' + dropbox_path
        
        try:
            metadata, response = self.dbx.files_download(dropbox_path)
            
            # Create parent directories if needed
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ Archivo descargado: {local_path}")
            return True
        except ApiError as e:
            print(f"❌ Error descargando archivo '{dropbox_path}': {e}")
            return False
    
    def create_shared_link(self, path: str) -> str:
        """
        Create a shared link for a file or folder
        
        Args:
            path: Path to file or folder
        
        Returns:
            Shared link URL or None on error
        """
        if not self.dbx:
            return None
        
        # Ensure path starts with /
        if not path.startswith('/'):
            path = '/' + path
        
        try:
            # Try to get existing shared link first
            links = self.dbx.sharing_list_shared_links(path=path)
            if links.links:
                return links.links[0].url
            
            # Create new shared link
            link = self.dbx.sharing_create_shared_link_with_settings(path)
            return link.url
        except ApiError as e:
            # Link might already exist
            if hasattr(e.error, 'get_shared_link_already_exists'):
                try:
                    links = self.dbx.sharing_list_shared_links(path=path)
                    if links.links:
                        return links.links[0].url
                except:
                    pass
            print(f"⚠️ No se pudo crear link compartido para '{path}': {e}")
            return None
    
    def delete_file(self, path: str) -> bool:
        """
        Delete a file or folder
        
        Args:
            path: Path to delete
        
        Returns:
            True if successful, False on error
        """
        if not self.dbx:
            return False
        
        # Ensure path starts with /
        if not path.startswith('/'):
            path = '/' + path
        
        try:
            self.dbx.files_delete_v2(path)
            print(f"✅ Eliminado: {path}")
            return True
        except ApiError as e:
            print(f"❌ Error eliminando '{path}': {e}")
            return False
    
    def navegar_y_crear_estructura(self, articulo: str, pais: str, color: str) -> str:
        """
        Navigate through LEBENGOOD/FOTOS/FOTOS ORDENADAS/{PAÍS}/{ARTÍCULO}/{COLOR}
        and create any missing folders, returns the final folder path
        
        Args:
            articulo: Article name
            pais: Country name
            color: Color name
        
        Returns:
            Final folder path or None on error
        """
        if not self.dbx:
            return None
        
        # Build the path structure
        path_parts = [
            "LEBENGOOD",
            "FOTOS",
            "FOTOS ORDENADAS",
            pais,
            articulo,
            color
        ]
        
        # Create the full path
        full_path = '/' + '/'.join(path_parts)
        
        # Create the entire structure
        if self.create_folder_structure(full_path):
            return full_path
        
        return None
    
    def get_space_usage(self) -> dict:
        """
        Get account space usage information
        
        Returns:
            Dictionary with used, allocated, and available space in bytes
        """
        if not self.dbx:
            return None
        
        try:
            usage = self.dbx.users_get_space_usage()
            return {
                'used': usage.used,
                'allocated': usage.allocation.get_individual().allocated,
                'available': usage.allocation.get_individual().allocated - usage.used
            }
        except ApiError as e:
            print(f"❌ Error obteniendo uso de espacio: {e}")
            return None
