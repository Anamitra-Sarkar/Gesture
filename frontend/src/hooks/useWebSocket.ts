/**
 * Custom hook for WebSocket connection and real-time hand tracking
 * PRODUCTION ARCHITECTURE: Client sends frames to server for processing
 * Implements explicit WebSocket lifecycle: DISCONNECTED -> CONNECTING -> CONNECTED -> READY
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage, FrameAnalysis } from '../types';
import { WebSocketState } from '../types';
import { apiService } from '../services/api';

export interface UseWebSocketReturn {
  connectionState: WebSocketState;
  isConnected: boolean;
  isReady: boolean;
  frameAnalysis: FrameAnalysis | null;
  frameImage: string | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendFrame: (frameData: string) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connectionState, setConnectionState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [frameAnalysis, setFrameAnalysis] = useState<FrameAnalysis | null>(null);
  const [frameImage, setFrameImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    try {
      setConnectionState(WebSocketState.CONNECTING);
      setError(null);
      
      const ws = apiService.createWebSocket();
      wsRef.current = ws;

      // Set connection timeout (10 seconds)
      connectionTimeoutRef.current = window.setTimeout(() => {
        if (connectionState === WebSocketState.CONNECTING || connectionState === WebSocketState.CONNECTED) {
          console.error('WebSocket connection timeout - no READY signal received');
          setConnectionState(WebSocketState.ERROR);
          setError('Connection timeout. Backend did not respond in time.');
          ws.close();
        }
      }, 10000);

      ws.onopen = () => {
        console.log('WebSocket transport connected - waiting for READY signal');
        setConnectionState(WebSocketState.CONNECTED);
        // Don't set isConnected yet - wait for READY message from backend
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.message_type === 'ready') {
            // Backend is ready to process frames
            console.log('Backend READY signal received');
            setConnectionState(WebSocketState.READY);
            setError(null);
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
          } else if (message.message_type === 'frame_analysis') {
            // Set to READY if we receive frame analysis (backward compatibility)
            if (connectionState !== WebSocketState.READY) {
              console.log('Backend READY (implicit from frame_analysis)');
              setConnectionState(WebSocketState.READY);
              if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
              }
            }
            
            if (message.data.frame_analysis) {
              setFrameAnalysis(message.data.frame_analysis);
            }
            if (message.data.frame_image) {
              setFrameImage(message.data.frame_image);
            }
          } else if (message.message_type === 'error') {
            setError(message.data.error || 'Unknown error');
            setConnectionState(WebSocketState.ERROR);
          } else if (message.message_type === 'pong') {
            // Keep-alive pong received
            console.debug('Pong received');
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionState(WebSocketState.ERROR);
        setError('WebSocket connection error. Please check your network connection.');
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setConnectionState(WebSocketState.DISCONNECTED);
        wsRef.current = null;
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        // Provide user-friendly disconnect reason
        if (event.code === 1006) {
          setError('Connection lost. The server may be unavailable.');
        } else if (event.code !== 1000) {
          setError(`Disconnected: ${event.reason || 'Unknown reason'}`);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setConnectionState(WebSocketState.ERROR);
      setError('Failed to create WebSocket connection. Please refresh and try again.');
    }
  }, [connectionState]);

  const disconnect = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      // Send stop message
      try {
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
      } catch (err) {
        console.error('Error sending stop message:', err);
      }
      
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState(WebSocketState.DISCONNECTED);
    setFrameAnalysis(null);
    setFrameImage(null);
    setError(null);
  }, []);

  const sendFrame = useCallback((frameData: string) => {
    // Only send frames when connection is READY
    if (wsRef.current?.readyState === WebSocket.OPEN && connectionState === WebSocketState.READY) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'frame',
          frame: frameData,
          timestamp: Date.now()
        }));
      } catch (err) {
        const errorDetails = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error sending frame:', errorDetails);
        setError(`Failed to send frame to server: ${errorDetails}`);
        setConnectionState(WebSocketState.ERROR);
      }
    }
  }, [connectionState]);

  useEffect(() => {
    return () => {
      disconnect();
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectionTimeoutRef.current !== null) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [disconnect]);

  return {
    connectionState,
    isConnected: connectionState === WebSocketState.READY,
    isReady: connectionState === WebSocketState.READY,
    frameAnalysis,
    frameImage,
    error,
    connect,
    disconnect,
    sendFrame,
  };
}
