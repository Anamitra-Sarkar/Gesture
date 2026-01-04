"""
REST API endpoints for camera control.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from ..models.schemas import CameraStatus, ErrorResponse
from ..services.camera_service import CameraService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/camera", tags=["camera"])

# Global camera service instance
camera_service: CameraService = None


def get_camera_service() -> CameraService:
    """Get or create camera service instance."""
    global camera_service
    if camera_service is None:
        camera_service = CameraService()
    return camera_service


@router.post("/start", response_model=CameraStatus)
async def start_camera():
    """
    Start the webcam camera for live hand tracking.
    """
    service = get_camera_service()
    
    if service.is_active:
        logger.warning("Camera already active")
        info = service.get_camera_info()
        return CameraStatus(
            is_active=True,
            camera_index=info["camera_index"],
            resolution=(info["width"], info["height"]),
            fps=info["current_fps"]
        )
    
    success = service.start()
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to start camera. Check if camera is available and not in use."
        )
    
    info = service.get_camera_info()
    logger.info("Camera started successfully")
    
    return CameraStatus(
        is_active=True,
        camera_index=info["camera_index"],
        resolution=(info["width"], info["height"]),
        fps=info.get("fps", 30.0)
    )


@router.post("/stop")
async def stop_camera():
    """
    Stop the webcam camera.
    """
    service = get_camera_service()
    
    if not service.is_active:
        logger.warning("Camera not active")
        return {"status": "camera_not_active"}
    
    service.stop()
    logger.info("Camera stopped")
    
    return {"status": "stopped"}


@router.get("/status", response_model=CameraStatus)
async def get_camera_status():
    """
    Get current camera status and configuration.
    """
    service = get_camera_service()
    info = service.get_camera_info()
    
    if not info["is_active"]:
        return CameraStatus(
            is_active=False,
            camera_index=info["camera_index"],
            resolution=(0, 0),
            fps=0.0
        )
    
    return CameraStatus(
        is_active=True,
        camera_index=info["camera_index"],
        resolution=(info["width"], info["height"]),
        fps=info["current_fps"]
    )


@router.post("/reset")
async def reset_tracking():
    """
    Reset hand tracking state (clear history and smoothing).
    """
    service = get_camera_service()
    service.reset_tracking()
    logger.info("Tracking state reset")
    
    return {"status": "reset_complete"}
