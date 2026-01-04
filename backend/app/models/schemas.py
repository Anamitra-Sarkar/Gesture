"""
Pydantic models for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class GestureType(str, Enum):
    """Enumeration of supported gesture types."""
    UNKNOWN = "unknown"
    OPEN_PALM = "open_palm"
    FIST = "fist"
    PINCH = "pinch"
    POINTING = "pointing"
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    PEACE = "peace"
    OK_SIGN = "ok_sign"


class LandmarkPoint(BaseModel):
    """3D landmark point."""
    x: float = Field(..., description="X coordinate (normalized 0-1)")
    y: float = Field(..., description="Y coordinate (normalized 0-1)")
    z: float = Field(..., description="Z coordinate (relative depth)")


class HandLandmarks(BaseModel):
    """21 landmarks for a detected hand."""
    landmarks: List[LandmarkPoint] = Field(..., min_length=21, max_length=21)
    handedness: str = Field(..., description="Left or Right")
    handedness_confidence: float = Field(..., ge=0.0, le=1.0)


class DetectedGesture(BaseModel):
    """Detected gesture with metadata."""
    gesture_type: GestureType
    confidence: float = Field(..., ge=0.0, le=1.0)
    hand: str = Field(..., description="Which hand (Left/Right)")
    timestamp: float = Field(..., description="Detection timestamp")


class FrameAnalysis(BaseModel):
    """Complete analysis of a single frame."""
    frame_number: int
    timestamp: float
    hands: List[HandLandmarks] = Field(default_factory=list)
    gestures: List[DetectedGesture] = Field(default_factory=list)
    fps: Optional[float] = None
    processing_time_ms: Optional[float] = None


class CameraStatus(BaseModel):
    """Current camera status."""
    is_active: bool
    camera_index: int
    resolution: tuple[int, int]
    fps: float


class VideoUploadResponse(BaseModel):
    """Response after video upload."""
    file_id: str
    filename: str
    file_size: int
    duration_seconds: Optional[float] = None
    total_frames: Optional[int] = None
    status: str


class PerformanceMetrics(BaseModel):
    """Performance metrics for monitoring."""
    average_fps: float
    average_processing_time_ms: float
    frames_processed: int
    gestures_detected: int
    detection_accuracy: Optional[float] = None


class WebSocketMessage(BaseModel):
    """WebSocket message format."""
    message_type: str = Field(..., description="Type of message (frame_analysis, status, error)")
    data: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None
