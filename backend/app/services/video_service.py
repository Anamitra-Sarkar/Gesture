"""
Video file processing service for uploaded videos.
"""
import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Generator, Dict
import logging
import time
import uuid

from ..core.config import settings
from .hand_tracking import HandTrackingEngine, HandTrackingResult
from ..models.schemas import VideoUploadResponse


logger = logging.getLogger(__name__)


class VideoProcessingService:
    """
    Service for processing uploaded video files.
    Handles video decoding, frame extraction, and gesture analysis.
    """
    
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(exist_ok=True)
        self.active_videos = {}  # Track active video processing sessions
        logger.info("Video processing service initialized")
    
    def save_uploaded_file(self, file_content: bytes, filename: str) -> VideoUploadResponse:
        """
        Save uploaded video file and extract metadata.
        
        Args:
            file_content: Raw file bytes
            filename: Original filename
            
        Returns:
            VideoUploadResponse with metadata
        """
        try:
            # Validate file extension
            file_ext = Path(filename).suffix.lower()
            if file_ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
                raise ValueError(f"Unsupported file format: {file_ext}")
            
            # Validate file size
            file_size = len(file_content)
            max_size_bytes = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024
            if file_size > max_size_bytes:
                raise ValueError(
                    f"File too large: {file_size / 1024 / 1024:.2f}MB "
                    f"(max: {settings.MAX_VIDEO_SIZE_MB}MB)"
                )
            
            # Generate unique file ID
            file_id = str(uuid.uuid4())
            file_path = self.upload_dir / f"{file_id}{file_ext}"
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # Extract video metadata
            video = cv2.VideoCapture(str(file_path))
            total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = video.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0
            video.release()
            
            logger.info(
                f"Video saved: {filename} ({file_size / 1024:.2f}KB, "
                f"{duration:.2f}s, {total_frames} frames)"
            )
            
            return VideoUploadResponse(
                file_id=file_id,
                filename=filename,
                file_size=file_size,
                duration_seconds=duration,
                total_frames=total_frames,
                status="uploaded"
            )
            
        except Exception as e:
            logger.error(f"Error saving video: {e}")
            raise
    
    def process_video(
        self,
        file_id: str,
        draw_landmarks: bool = True,
        frame_skip: int = 1
    ) -> Generator[Dict, None, None]:
        """
        Process video file frame by frame.
        
        Args:
            file_id: Unique file identifier
            draw_landmarks: Whether to draw landmarks on frames
            frame_skip: Process every Nth frame (1 = all frames)
            
        Yields:
            Dictionary with frame analysis results
        """
        # Find video file
        video_path = None
        for ext in settings.ALLOWED_VIDEO_EXTENSIONS:
            path = self.upload_dir / f"{file_id}{ext}"
            if path.exists():
                video_path = path
                break
        
        if not video_path:
            raise FileNotFoundError(f"Video file not found: {file_id}")
        
        try:
            video = cv2.VideoCapture(str(video_path))
            hand_tracker = HandTrackingEngine()
            
            total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = video.get(cv2.CAP_PROP_FPS)
            
            frame_count = 0
            processed_count = 0
            start_time = time.time()
            
            logger.info(f"Starting video processing: {file_id} ({total_frames} frames)")
            
            while video.isOpened():
                ret, frame = video.read()
                
                if not ret:
                    break
                
                frame_count += 1
                
                # Skip frames if requested
                if frame_count % frame_skip != 0:
                    continue
                
                # Process frame
                result = hand_tracker.process_frame(frame, draw_landmarks)
                processed_count += 1
                
                # Calculate progress
                progress = (frame_count / total_frames) * 100 if total_frames > 0 else 0
                elapsed_time = time.time() - start_time
                processing_fps = processed_count / elapsed_time if elapsed_time > 0 else 0
                
                # Prepare result
                yield {
                    "frame_number": frame_count,
                    "progress": progress,
                    "hands": [hand.model_dump() for hand in result.landmarks],
                    "gestures": [gesture.model_dump() for gesture in result.gestures],
                    "processing_time_ms": result.processing_time_ms,
                    "processing_fps": processing_fps
                }
            
            video.release()
            hand_tracker.close()
            
            total_time = time.time() - start_time
            logger.info(
                f"Video processing completed: {file_id} "
                f"({processed_count} frames in {total_time:.2f}s, "
                f"{processed_count / total_time:.2f} fps)"
            )
            
        except Exception as e:
            logger.error(f"Error processing video: {e}")
            raise
    
    def get_video_info(self, file_id: str) -> Optional[Dict]:
        """
        Get metadata for a video file.
        
        Args:
            file_id: Unique file identifier
            
        Returns:
            Dictionary with video metadata or None
        """
        video_path = None
        for ext in settings.ALLOWED_VIDEO_EXTENSIONS:
            path = self.upload_dir / f"{file_id}{ext}"
            if path.exists():
                video_path = path
                break
        
        if not video_path:
            return None
        
        try:
            video = cv2.VideoCapture(str(video_path))
            
            info = {
                "file_id": file_id,
                "width": int(video.get(cv2.CAP_PROP_FRAME_WIDTH)),
                "height": int(video.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                "fps": video.get(cv2.CAP_PROP_FPS),
                "total_frames": int(video.get(cv2.CAP_PROP_FRAME_COUNT)),
                "file_size": video_path.stat().st_size
            }
            
            video.release()
            return info
            
        except Exception as e:
            logger.error(f"Error getting video info: {e}")
            return None
    
    def delete_video(self, file_id: str) -> bool:
        """
        Delete a video file.
        
        Args:
            file_id: Unique file identifier
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            for ext in settings.ALLOWED_VIDEO_EXTENSIONS:
                path = self.upload_dir / f"{file_id}{ext}"
                if path.exists():
                    path.unlink()
                    logger.info(f"Video deleted: {file_id}")
                    return True
            return False
        except Exception as e:
            logger.error(f"Error deleting video: {e}")
            return False
