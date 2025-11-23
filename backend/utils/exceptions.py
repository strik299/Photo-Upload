"""
Custom exceptions for LEBENGOOD application
"""


class AppException(Exception):
    """Base exception for all application errors"""
    def __init__(self, message: str, error_code: str = "APP_ERROR", details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(AppException):
    """Raised when input validation fails"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "VALIDATION_ERROR", details)


class AuthenticationError(AppException):
    """Raised when Google Drive authentication fails"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "AUTH_ERROR", details)


class DriveServiceError(AppException):
    """Raised when Google Drive operations fail"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "DRIVE_ERROR", details)


class FileProcessingError(AppException):
    """Raised when file processing operations fail"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "FILE_PROCESSING_ERROR", details)


class FolderNotFoundError(AppException):
    """Raised when a required folder is not found in Drive"""
    def __init__(self, folder_name: str, parent_path: str = None):
        message = f"Carpeta '{folder_name}' no encontrada"
        if parent_path:
            message += f" en '{parent_path}'"
        details = {"folder_name": folder_name, "parent_path": parent_path}
        super().__init__(message, "FOLDER_NOT_FOUND", details)
