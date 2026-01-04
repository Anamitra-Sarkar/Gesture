"""
REST API endpoints for video upload and processing.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Dict
import logging
import json

from ..models.schemas import VideoUploadResponse, ErrorResponse
from ..services.video_service import VideoProcessingService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/video", tags=["video"])

# Global video processing service
video_service = VideoProcessingService()


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for processing.
    Supports MP4, AVI, WebM, MOV formats.
    """
    try:
        # Read file content
        content = await file.read()
        
        # Save and process metadata
        response = video_service.save_uploaded_file(content, file.filename)
        
        logger.info(f"Video uploaded: {file.filename} (ID: {response.file_id})")
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading video: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload video")


@router.get("/process/{file_id}")
async def process_video(file_id: str, frame_skip: int = 1):
    """
    Process uploaded video and stream results.
    Returns a stream of JSON objects with frame-by-frame analysis.
    
    Args:
        file_id: Unique video file identifier
        frame_skip: Process every Nth frame (default: 1 = all frames)
    """
    try:
        async def generate_results():
            """Generator for streaming video processing results."""
            for result in video_service.process_video(file_id, draw_landmarks=False, frame_skip=frame_skip):
                yield json.dumps(result) + "\n"
        
        return StreamingResponse(
            generate_results(),
            media_type="application/x-ndjson"
        )
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Video file not found")
    except Exception as e:
        logger.error(f"Error processing video: {e}")
        raise HTTPException(status_code=500, detail="Failed to process video")


@router.get("/info/{file_id}")
async def get_video_info(file_id: str):
    """
    Get metadata for an uploaded video.
    """
    info = video_service.get_video_info(file_id)
    
    if info is None:
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return info


@router.delete("/{file_id}")
async def delete_video(file_id: str):
    """
    Delete an uploaded video file.
    """
    success = video_service.delete_video(file_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return {"status": "deleted", "file_id": file_id}
