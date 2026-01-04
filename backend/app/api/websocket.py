"""
WebSocket endpoint for real-time hand tracking streaming.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import json
import asyncio
import time
import cv2
import base64

from ..services.camera_service import CameraService
from ..models.schemas import FrameAnalysis, WebSocketMessage


logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])

# Global camera service
camera_service: CameraService = None


def get_camera_service() -> CameraService:
    """Get or create camera service instance."""
    global camera_service
    if camera_service is None:
        camera_service = CameraService()
    return camera_service


@router.websocket("/ws/live")
async def websocket_live_tracking(websocket: WebSocket):
    """
    WebSocket endpoint for real-time hand tracking.
    Streams hand landmarks, gestures, and performance metrics.
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    service = get_camera_service()
    
    try:
        # Start camera if not already active
        if not service.is_active:
            success = service.start()
            if not success:
                await websocket.send_json({
                    "message_type": "error",
                    "data": {"error": "Failed to start camera"},
                    "timestamp": time.time()
                })
                await websocket.close()
                return
        
        frame_count = 0
        
        while True:
            # Check for client messages (e.g., stop command)
            try:
                # Non-blocking receive with timeout
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.001
                )
                data = json.loads(message)
                
                if data.get("command") == "stop":
                    logger.info("Received stop command from client")
                    break
                    
            except asyncio.TimeoutError:
                pass  # No message received, continue processing
            
            # Process frame
            result = service.process_frame(draw_landmarks=True)
            
            if result is None:
                await asyncio.sleep(0.01)
                continue
            
            frame_count += 1
            
            # Prepare frame analysis
            frame_analysis = FrameAnalysis(
                frame_number=frame_count,
                timestamp=time.time(),
                hands=[hand for hand in result.landmarks],
                gestures=[gesture for gesture in result.gestures],
                fps=service.get_current_fps(),
                processing_time_ms=result.processing_time_ms
            )
            
            # Encode annotated frame to base64 for transmission
            frame_data = None
            if result.annotated_frame is not None:
                # Resize frame for efficient transmission
                frame_resized = cv2.resize(result.annotated_frame, (640, 480))
                _, buffer = cv2.imencode('.jpg', frame_resized, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_data = base64.b64encode(buffer).decode('utf-8')
            
            # Send data to client
            message = WebSocketMessage(
                message_type="frame_analysis",
                data={
                    "frame_analysis": frame_analysis.model_dump(),
                    "frame_image": frame_data
                },
                timestamp=time.time()
            )
            
            await websocket.send_json(message.model_dump())
            
            # Control frame rate (don't overwhelm the client)
            await asyncio.sleep(0.033)  # ~30 FPS
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected by client")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "message_type": "error",
                "data": {"error": str(e)},
                "timestamp": time.time()
            })
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass
        logger.info("WebSocket connection closed")
