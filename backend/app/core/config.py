"""
Configuration settings for the gesture recognition backend.
"""
from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import json
import logging


logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    APP_NAME: str = "Hand Gesture Recognition Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG_MODE: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Default CORS origins - these will be used if CORS_ORIGINS env var is not set
    _default_cors_origins: List[str] = [
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:5173",
        "https://gesture-detection-lac.vercel.app"  # Production frontend
    ]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Override PORT from environment if set (for Render support)
        port_env = os.getenv("PORT")
        if port_env:
            try:
                self.PORT = int(port_env)
            except ValueError:
                logger.warning(f"Invalid PORT value: {port_env}, using default 8000")
                self.PORT = 8000
    
    @property
    def allowed_origins(self) -> List[str]:
        """
        Get CORS origins from environment or use defaults.
        Supports multiple formats:
        - Single origin: "https://example.com"
        - Comma-separated: "https://example.com,https://another.com"
        - JSON array: '["https://example.com", "https://another.com"]'
        """
        env_origins = os.getenv("CORS_ORIGINS", "").strip()
        
        if not env_origins:
            logger.info(f"Using default CORS origins: {self._default_cors_origins}")
            return self._default_cors_origins
        
        # Try to parse as JSON array first
        if env_origins.startswith('['):
            try:
                origins = json.loads(env_origins)
                if isinstance(origins, list):
                    parsed_origins = [str(origin).strip() for origin in origins if origin]
                    logger.info(f"Parsed CORS origins from JSON: {parsed_origins}")
                    return parsed_origins
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse CORS_ORIGINS as JSON: {e}")
        
        # Try comma-separated list
        if ',' in env_origins:
            parsed_origins = [origin.strip() for origin in env_origins.split(',') if origin.strip()]
            logger.info(f"Parsed CORS origins from CSV: {parsed_origins}")
            return parsed_origins
        
        # Single origin
        parsed_origins = [env_origins]
        logger.info(f"Using single CORS origin: {parsed_origins}")
        return parsed_origins
    
    # Camera Settings
    CAMERA_INDEX: int = 0
    CAMERA_WIDTH: int = 1280
    CAMERA_HEIGHT: int = 720
    CAMERA_FPS: int = 30
    
    # MediaPipe Settings
    MP_MODEL_COMPLEXITY: int = 1  # 0 or 1
    MP_MIN_DETECTION_CONFIDENCE: float = 0.7
    MP_MIN_TRACKING_CONFIDENCE: float = 0.5
    MP_MAX_NUM_HANDS: int = 2
    
    # Processing Settings
    FRAME_SKIP: int = 1  # Process every N frames
    LANDMARK_SMOOTHING_FACTOR: float = 0.3  # 0 = no smoothing, 1 = max smoothing
    
    # Video Upload Settings
    MAX_VIDEO_SIZE_MB: int = 100
    ALLOWED_VIDEO_EXTENSIONS: list = [".mp4", ".avi", ".webm", ".mov"]
    UPLOAD_DIR: str = "uploads"
    
    # Gesture Recognition Settings
    GESTURE_CONFIDENCE_THRESHOLD: float = 0.75
    GESTURE_TEMPORAL_WINDOW: int = 5  # Number of frames for temporal consistency
    
    # Performance
    MAX_PROCESSING_TIME_MS: int = 100  # Maximum time to process one frame
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
