"""
WebSocket endpoint for real-time hand tracking streaming.
Client-side architecture: Browser captures camera, sends frames to server for processing.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import json
import asyncio
import time
import cv2
import numpy as np
import base64

from ..services.hand_tracking import HandTrackingEngine
from ..models.schemas import FrameAnalysis, WebSocketMessage


logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


@router.websocket("/ws/live")
async def websocket_live_tracking(websocket: WebSocket):
    """
    WebSocket endpoint for real-time hand tracking.
    
    PRODUCTION ARCHITECTURE:
    - Client captures camera frames using navigator.mediaDevices.getUserMedia
    - Client sends base64-encoded frames to this endpoint
    - Server processes frames and returns landmarks + gestures
    - No server-side camera access (cloud-compatible)
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    # Create hand tracking engine for this connection
    hand_tracker = HandTrackingEngine()
    frame_count = 0
    
    try:
        while True:
            try:
                # Receive frame data from client
                message_text = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=10.0  # 10 second timeout for client frames
                )
                
                message_data = json.loads(message_text)
                
                # Handle different message types
                if message_data.get("type") == "frame":
                    # Client sent a frame to process
                    frame_data = message_data.get("frame")
                    
                    if not frame_data:
                        await websocket.send_json({
                            "message_type": "error",
                            "data": {"error": "No frame data received"},
                            "timestamp": time.time()
                        })
                        continue
                    
                    # Decode base64 frame
                    try:
                        # Remove data URL prefix if present
                        if "base64," in frame_data:
                            frame_data = frame_data.split("base64,")[1]
                        
                        # Decode base64 to bytes
                        frame_bytes = base64.b64decode(frame_data)
                        
                        # Convert to numpy array
                        nparr = np.frombuffer(frame_bytes, np.uint8)
                        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                        
                        if frame is None:
                            await websocket.send_json({
                                "message_type": "error",
                                "data": {"error": "Failed to decode frame"},
                                "timestamp": time.time()
                            })
                            continue
                        
                    except Exception as e:
                        logger.error(f"Error decoding frame: {e}")
                        await websocket.send_json({
                            "message_type": "error",
                            "data": {"error": f"Frame decode error: {str(e)}"},
                            "timestamp": time.time()
                        })
                        continue
                    
                    # Process frame with hand tracking
                    result = hand_tracker.process_frame(frame, draw_landmarks=True)
                    
                    if result is None:
                        continue
                    
                    frame_count += 1
                    
                    # Prepare frame analysis
                    frame_analysis = FrameAnalysis(
                        frame_number=frame_count,
                        timestamp=time.time(),
                        hands=[hand for hand in result.landmarks],
                        gestures=[gesture for gesture in result.gestures],
                        fps=0.0,  # FPS calculated client-side
                        processing_time_ms=result.processing_time_ms
                    )
                    
                    # Encode annotated frame (with landmarks drawn) for client display
                    annotated_frame_data = None
                    if result.annotated_frame is not None:
                        try:
                            # Resize for efficient transmission
                            frame_resized = cv2.resize(result.annotated_frame, (640, 480))
                            _, buffer = cv2.imencode('.jpg', frame_resized, [cv2.IMWRITE_JPEG_QUALITY, 80])
                            annotated_frame_data = base64.b64encode(buffer).decode('utf-8')
                        except Exception as e:
                            logger.error(f"Error encoding annotated frame: {e}")
                    
                    # Send analysis back to client
                    response = WebSocketMessage(
                        message_type="frame_analysis",
                        data={
                            "frame_analysis": frame_analysis.model_dump(),
                            "frame_image": annotated_frame_data
                        },
                        timestamp=time.time()
                    )
                    
                    await websocket.send_json(response.model_dump())
                
                elif message_data.get("type") == "ping":
                    # Keep-alive ping from client
                    await websocket.send_json({
                        "message_type": "pong",
                        "data": {},
                        "timestamp": time.time()
                    })
                
                elif message_data.get("type") == "stop":
                    logger.info("Received stop command from client")
                    break
                
                else:
                    logger.warning(f"Unknown message type: {message_data.get('type')}")
            
            except asyncio.TimeoutError:
                # No frame received in timeout period
                logger.warning("No frame received from client (timeout)")
                await websocket.send_json({
                    "message_type": "error",
                    "data": {"error": "No frames received from client"},
                    "timestamp": time.time()
                })
                break
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected by client")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "message_type": "error",
                "data": {"error": str(e)},
                "timestamp": time.time()
            })
        except:
            pass
    finally:
        # Cleanup
        hand_tracker.close()
        try:
            await websocket.close()
        except:
            pass
        logger.info("WebSocket connection closed")
