/**
 * Custom hook for WebSocket connection and real-time hand tracking
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage, FrameAnalysis } from '../types';
import { apiService } from '../services/api';

export interface UseWebSocketReturn {
  isConnected: boolean;
  frameAnalysis: FrameAnalysis | null;
  frameImage: string | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [frameAnalysis, setFrameAnalysis] = useState<FrameAnalysis | null>(null);
  const [frameImage, setFrameImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = apiService.createWebSocket();
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.message_type === 'frame_analysis') {
            if (message.data.frame_analysis) {
              setFrameAnalysis(message.data.frame_analysis);
            }
            if (message.data.frame_image) {
              setFrameImage(message.data.frame_image);
            }
          } else if (message.message_type === 'error') {
            setError(message.data.error || 'Unknown error');
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setFrameAnalysis(null);
    setFrameImage(null);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [disconnect]);

  return {
    isConnected,
    frameAnalysis,
    frameImage,
    error,
    connect,
    disconnect,
  };
}
