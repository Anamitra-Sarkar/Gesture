"""
Configuration settings for the gesture recognition backend.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    APP_NAME: str = "Hand Gesture Recognition Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG_MODE: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]
    
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
