/**
 * Type definitions for the Hand Gesture Recognition Platform
 */

export const GestureType = {
  UNKNOWN: 'unknown',
  OPEN_PALM: 'open_palm',
  FIST: 'fist',
  PINCH: 'pinch',
  POINTING: 'pointing',
  THUMBS_UP: 'thumbs_up',
  THUMBS_DOWN: 'thumbs_down',
  PEACE: 'peace',
  OK_SIGN: 'ok_sign',
} as const;

export type GestureType = typeof GestureType[keyof typeof GestureType];

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface HandLandmarks {
  landmarks: LandmarkPoint[];
  handedness: string;
  handedness_confidence: number;
}

export interface DetectedGesture {
  gesture_type: GestureType;
  confidence: number;
  hand: string;
  timestamp: number;
}

export interface FrameAnalysis {
  frame_number: number;
  timestamp: number;
  hands: HandLandmarks[];
  gestures: DetectedGesture[];
  fps?: number;
  processing_time_ms?: number;
}

export interface CameraStatus {
  is_active: boolean;
  camera_index: number;
  resolution: [number, number];
  fps: number;
}

export interface VideoUploadResponse {
  file_id: string;
  filename: string;
  file_size: number;
  duration_seconds?: number;
  total_frames?: number;
  status: string;
}

export interface PerformanceMetrics {
  average_fps: number;
  average_processing_time_ms: number;
  frames_processed: number;
  gestures_detected: number;
  detection_accuracy?: number;
}

export interface WebSocketMessage {
  message_type: string;
  data: {
    frame_analysis?: FrameAnalysis;
    frame_image?: string;
    error?: string;
  };
  timestamp: number;
}
