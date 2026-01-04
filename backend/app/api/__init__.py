"""API module initialization."""
from .camera import router as camera_router
from .video import router as video_router
from .websocket import router as websocket_router

__all__ = ["camera_router", "video_router", "websocket_router"]
