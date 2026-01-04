"""
Camera management service for live webcam feed processing.
"""
import cv2
import numpy as np
from typing import Optional
import logging
import time
from threading import Thread, Lock
from collections import deque

from ..core.config import settings
from .hand_tracking import HandTrackingEngine, HandTrackingResult


logger = logging.getLogger(__name__)


class CameraService:
    """
    Production-grade camera service with thread-safe frame capture.
    Manages webcam access, frame buffering, and real-time processing.
    """
    
    def __init__(self, camera_index: Optional[int] = None):
        self.camera_index = camera_index or settings.CAMERA_INDEX
        self.camera = None
        self.is_active = False
        self.current_frame = None
        self.frame_lock = Lock()
        
        # Performance tracking
        self.fps_tracker = deque(maxlen=30)
        self.last_frame_time = time.time()
        
        # Hand tracking engine
        self.hand_tracker = HandTrackingEngine()
        
        logger.info(f"Camera service initialized with index {self.camera_index}")
    
    def start(self) -> bool:
        """
        Start the camera capture.
        
        Returns:
            True if camera started successfully, False otherwise
        """
        try:
            self.camera = cv2.VideoCapture(self.camera_index)
            
            if not self.camera.isOpened():
                logger.error(f"Failed to open camera {self.camera_index}")
                return False
            
            # Configure camera settings
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, settings.CAMERA_WIDTH)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, settings.CAMERA_HEIGHT)
            self.camera.set(cv2.CAP_PROP_FPS, settings.CAMERA_FPS)
            
            # Verify settings
            actual_width = int(self.camera.get(cv2.CAP_PROP_FRAME_WIDTH))
            actual_height = int(self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT))
            actual_fps = self.camera.get(cv2.CAP_PROP_FPS)
            
            logger.info(
                f"Camera started: {actual_width}x{actual_height} @ {actual_fps}fps"
            )
            
            self.is_active = True
            return True
            
        except Exception as e:
            logger.error(f"Error starting camera: {e}")
            return False
    
    def stop(self):
        """Stop the camera capture and clean up resources."""
        self.is_active = False
        
        if self.camera:
            self.camera.release()
            self.camera = None
        
        self.hand_tracker.close()
        logger.info("Camera stopped")
    
    def get_frame(self) -> Optional[np.ndarray]:
        """
        Capture a single frame from the camera.
        
        Returns:
            Frame as numpy array or None if capture failed
        """
        if not self.is_active or not self.camera:
            return None
        
        try:
            ret, frame = self.camera.read()
            
            if not ret or frame is None:
                logger.warning("Failed to capture frame")
                return None
            
            # Update FPS tracking
            current_time = time.time()
            fps = 1.0 / (current_time - self.last_frame_time) if self.last_frame_time else 0
            self.fps_tracker.append(fps)
            self.last_frame_time = current_time
            
            with self.frame_lock:
                self.current_frame = frame.copy()
            
            return frame
            
        except Exception as e:
            logger.error(f"Error capturing frame: {e}")
            return None
    
    def process_frame(self, frame: Optional[np.ndarray] = None, draw_landmarks: bool = True) -> Optional[HandTrackingResult]:
        """
        Process a frame for hand tracking and gesture recognition.
        
        Args:
            frame: Optional frame to process. If None, captures new frame.
            draw_landmarks: Whether to draw landmarks on the frame
            
        Returns:
            HandTrackingResult or None
        """
        if frame is None:
            frame = self.get_frame()
        
        if frame is None:
            return None
        
        try:
            result = self.hand_tracker.process_frame(frame, draw_landmarks)
            return result
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return None
    
    def get_current_fps(self) -> float:
        """
        Get current average FPS.
        
        Returns:
            Average FPS over recent frames
        """
        if not self.fps_tracker:
            return 0.0
        return sum(self.fps_tracker) / len(self.fps_tracker)
    
    def get_camera_info(self) -> dict:
        """
        Get current camera configuration and status.
        
        Returns:
            Dictionary with camera information
        """
        if not self.camera or not self.is_active:
            return {
                "is_active": False,
                "camera_index": self.camera_index
            }
        
        return {
            "is_active": True,
            "camera_index": self.camera_index,
            "width": int(self.camera.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "fps": self.camera.get(cv2.CAP_PROP_FPS),
            "current_fps": self.get_current_fps()
        }
    
    def reset_tracking(self):
        """Reset hand tracking state."""
        self.hand_tracker.reset()
        self.fps_tracker.clear()
        logger.info("Tracking state reset")
