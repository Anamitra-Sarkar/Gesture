/**
 * Custom hook for gesture tracking and analytics
 */
import { useState, useEffect, useCallback } from 'react';
import type { DetectedGesture, PerformanceMetrics } from '../types';
import {
  saveGestureToHistory,
  updateAnalytics,
  createSessionId,
  saveSessionData,
  getSessionData,
} from '../utils/storage';

export interface UseGestureTrackingReturn {
  recentGestures: DetectedGesture[];
  metrics: PerformanceMetrics;
  addGesture: (gesture: DetectedGesture) => void;
  updateMetrics: (fps: number, processingTime: number) => void;
  reset: () => void;
}

export function useGestureTracking(): UseGestureTrackingReturn {
  const [recentGestures, setRecentGestures] = useState<DetectedGesture[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    average_fps: 0,
    average_processing_time_ms: 0,
    frames_processed: 0,
    gestures_detected: 0,
  });

  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [processingTimeHistory, setProcessingTimeHistory] = useState<number[]>([]);
  const [sessionId] = useState(() => {
    // Try to get existing session or create new one
    const existingSession = getSessionData();
    if (existingSession) {
      return existingSession.sessionId;
    }
    const newSessionId = createSessionId();
    saveSessionData(newSessionId, Date.now());
    return newSessionId;
  });

  const addGesture = useCallback((gesture: DetectedGesture) => {
    setRecentGestures((prev) => {
      const updated = [gesture, ...prev];
      return updated.slice(0, 10); // Keep last 10 gestures
    });

    setMetrics((prev) => ({
      ...prev,
      gestures_detected: prev.gestures_detected + 1,
    }));

    // Persist to localStorage
    saveGestureToHistory({
      type: gesture.gesture_type,
      confidence: gesture.confidence,
      timestamp: Date.now(),
      sessionId,
    });

    // Update analytics
    updateAnalytics({
      type: gesture.gesture_type,
      confidence: gesture.confidence,
      timestamp: Date.now(),
      sessionId,
    });
  }, [sessionId]);

  const updateMetrics = useCallback((fps: number, processingTime: number) => {
    setFpsHistory((prev) => {
      const updated = [...prev, fps];
      return updated.slice(-30); // Keep last 30 values
    });

    setProcessingTimeHistory((prev) => {
      const updated = [...prev, processingTime];
      return updated.slice(-30);
    });

    setMetrics((prev) => ({
      ...prev,
      frames_processed: prev.frames_processed + 1,
    }));
  }, []);

  const reset = useCallback(() => {
    setRecentGestures([]);
    setFpsHistory([]);
    setProcessingTimeHistory([]);
    setMetrics({
      average_fps: 0,
      average_processing_time_ms: 0,
      frames_processed: 0,
      gestures_detected: 0,
    });
  }, []);

  // Calculate averages
  useEffect(() => {
    if (fpsHistory.length > 0) {
      const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
      const avgProcessingTime =
        processingTimeHistory.reduce((a, b) => a + b, 0) / processingTimeHistory.length;

      setMetrics((prev) => ({
        ...prev,
        average_fps: avgFps,
        average_processing_time_ms: avgProcessingTime,
      }));
    }
  }, [fpsHistory, processingTimeHistory]);

  return {
    recentGestures,
    metrics,
    addGesture,
    updateMetrics,
    reset,
  };
}
