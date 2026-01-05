/**
 * Custom hook for client-side camera capture
 * PRODUCTION ARCHITECTURE: Camera is captured in the browser, not on the server
 */
import { useEffect, useRef, useState, useCallback } from 'react';

export interface CameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  frameRate?: number;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  startCamera: (options?: CameraOptions) => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => string | null;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (options: CameraOptions = {}) => {
    const {
      width = 1280,
      height = 720,
      facingMode = 'user',
      frameRate = 30,
    } = options;

    try {
      setError(null);

      // Request camera access from browser
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: facingMode,
          frameRate: { ideal: frameRate },
        },
      });

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsActive(true);
      
      console.log('Camera started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera';
      setError(errorMessage);
      setIsActive(false);
      console.error('Camera error:', err);
      throw err;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setStream(null);
      setIsActive(false);
      console.log('Camera stopped');
    }
  }, [stream]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !isActive) {
      return null;
    }

    try {
      // Create canvas to capture frame
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 JPEG
      const frameData = canvas.toDataURL('image/jpeg', 0.8);
      return frameData;
    } catch (err) {
      console.error('Error capturing frame:', err);
      return null;
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream,
    isActive,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  };
}
