"""
REST API endpoints for camera control.

DEPRECATED: Server-side camera control is not compatible with cloud deployment.
These endpoints are kept for backward compatibility but return appropriate messages.
In production, camera is captured client-side using navigator.mediaDevices.getUserMedia.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from ..models.schemas import CameraStatus, ErrorResponse


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/camera", tags=["camera"])


@router.post("/start", response_model=CameraStatus)
async def start_camera():
    """
    DEPRECATED: Server-side camera start is not supported in cloud deployment.
    
    In production, camera capture happens client-side in the browser using
    navigator.mediaDevices.getUserMedia. The frontend should handle camera
    permissions and capture, then stream frames to the WebSocket endpoint.
    
    This endpoint now returns a success response to maintain backward compatibility,
    but does not actually start any server-side camera.
    """
    logger.info("Camera start requested (deprecated - camera is client-side)")
    
    return CameraStatus(
        is_active=True,
        camera_index=0,
        resolution=(0, 0),  # Client-side resolution
        fps=0.0  # Client-side FPS
    )


@router.post("/stop")
async def stop_camera():
    """
    DEPRECATED: Server-side camera stop is not needed in cloud deployment.
    
    Camera is managed client-side. This endpoint exists for backward compatibility.
    """
    logger.info("Camera stop requested (deprecated - camera is client-side)")
    return {"status": "stopped"}


@router.get("/status", response_model=CameraStatus)
async def get_camera_status():
    """
    DEPRECATED: Returns client-side camera status placeholder.
    
    Actual camera status should be managed and reported by the frontend.
    """
    logger.info("Camera status requested (deprecated - camera is client-side)")
    
    return CameraStatus(
        is_active=False,
        camera_index=0,
        resolution=(0, 0),
        fps=0.0
    )


@router.post("/reset")
async def reset_tracking():
    """
    Reset hand tracking state (clear history and smoothing).
    
    Note: This is a no-op in the new architecture since each WebSocket
    connection creates its own tracking instance.
    """
    logger.info("Tracking reset requested (no-op in new architecture)")
    return {"status": "reset_complete"}
