/**
 * Main Application Component
 * PRODUCTION ARCHITECTURE: Client-side camera capture with server processing
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GestureCanvas } from './components/features/GestureCanvas';
import { GestureDashboard } from './components/features/GestureDashboard';
import { PerformanceHUD } from './components/features/PerformanceHUD';
import { ControlPanel } from './components/features/ControlPanel';
import { VideoUploadModal } from './components/features/VideoUploadModal';
import { PermissionModal } from './components/features/PermissionModal';
import { AnalyticsDashboard } from './components/features/AnalyticsDashboard';
import { useWebSocket } from './hooks/useWebSocket';
import { useCamera } from './hooks/useCamera';
import { useGestureTracking } from './hooks/useGestureTracking';
import { apiService } from './services/api';
import './styles/global.css';
import './App.css';

function App() {
  const [cameraActive, setCameraActive] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'ready' | 'error' | 'idle'>('idle');
  
  const { connectionState, isConnected, isReady, frameAnalysis, frameImage, error: wsError, connect, disconnect, sendFrame } = useWebSocket();
  const { videoRef, isActive: isCameraActive, startCamera, stopCamera, captureFrame } = useCamera();
  const { recentGestures, metrics, addGesture, updateMetrics, reset } = useGestureTracking();
  
  const frameIntervalRef = useRef<number | null>(null);
  const fpsIntervalRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);

  // Process frame analysis data
  useEffect(() => {
    if (frameAnalysis) {
      // Add detected gestures
      frameAnalysis.gestures.forEach((gesture) => {
        addGesture(gesture);
      });

      // Update metrics
      if (frameAnalysis.fps !== undefined && frameAnalysis.processing_time_ms !== undefined) {
        updateMetrics(fpsRef.current, frameAnalysis.processing_time_ms);
      }
    }
  }, [frameAnalysis, addGesture, updateMetrics]);

  // Start sending frames to server when camera and WebSocket are READY
  useEffect(() => {
    if (isCameraActive && isReady) {
      // Backend is ready, start sending frames
      setBackendStatus('ready');
      
      // Send frames at ~15 FPS (lower than capture rate to avoid overwhelming server)
      const sendInterval = 1000 / 15; // ~66ms
      
      frameIntervalRef.current = window.setInterval(() => {
        const frame = captureFrame();
        if (frame) {
          sendFrame(frame);
          
          // Calculate FPS
          const now = Date.now();
          const timeDiff = now - lastFrameTimeRef.current;
          if (timeDiff > 0) {
            fpsRef.current = 1000 / timeDiff;
          }
          lastFrameTimeRef.current = now;
          frameCountRef.current++;
        }
      }, sendInterval);
      
      // Update FPS counter
      fpsIntervalRef.current = window.setInterval(() => {
        updateMetrics(fpsRef.current, frameAnalysis?.processing_time_ms || 0);
      }, 1000);
    } else {
      // Clear interval when not active
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current);
        fpsIntervalRef.current = null;
      }
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current);
      }
    };
  }, [isCameraActive, isReady, captureFrame, sendFrame, frameAnalysis, updateMetrics]);

  const handleStartCamera = async () => {
    // First, show permission modal if not already granted
    if (!permissionGranted) {
      setPermissionModalOpen(true);
      return;
    }

    try {
      setBackendStatus('connecting');
      
      // CRITICAL: Start client-side camera FIRST - show preview immediately
      await startCamera({
        width: 1280,
        height: 720,
        facingMode: 'user',
        frameRate: 30
      });
      
      setCameraActive(true);
      console.log('Camera started successfully - preview visible');
      
      // PARALLEL: Connect to WebSocket for backend processing (non-blocking)
      // Camera preview is already visible, backend connection happens asynchronously
      connect();
      
    } catch (error) {
      console.error('Failed to start camera:', error);
      setBackendStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Failed to start camera. Please check your camera permissions and try again.';
      alert(errorMsg);
    }
  };

  const handlePermissionGranted = () => {
    setPermissionGranted(true);
    // Automatically start camera after permission is granted
    setTimeout(() => {
      handleStartCameraAfterPermission();
    }, 500);
  };

  const handleStartCameraAfterPermission = async () => {
    try {
      setBackendStatus('connecting');
      
      // CRITICAL: Start client-side camera FIRST - show preview immediately
      await startCamera({
        width: 1280,
        height: 720,
        facingMode: 'user',
        frameRate: 30
      });
      
      setCameraActive(true);
      console.log('Camera started after permission grant - preview visible');
      
      // PARALLEL: Connect to WebSocket for backend processing (non-blocking)
      connect();
      
    } catch (error) {
      console.error('Failed to start camera:', error);
      setBackendStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Failed to start camera. Please check your camera permissions and try again.';
      alert(errorMsg);
    }
  };

  const handleStopCamera = async () => {
    try {
      // Stop client-side camera
      stopCamera();
      
      // Disconnect WebSocket
      disconnect();
      
      setCameraActive(false);
      setBackendStatus('idle');
      
      // Reset counters
      frameCountRef.current = 0;
      fpsRef.current = 0;
      
      console.log('Camera stopped successfully');
    } catch (error) {
      console.error('Failed to stop camera:', error);
    }
  };

  const handleReset = async () => {
    try {
      await apiService.resetTracking();
      reset();
      
      // Reset counters
      frameCountRef.current = 0;
      fpsRef.current = 0;
    } catch (error) {
      console.error('Failed to reset tracking:', error);
    }
  };

  const currentGesture =
    frameAnalysis?.gestures && frameAnalysis.gestures.length > 0
      ? frameAnalysis.gestures[0]
      : undefined;

  return (
    <div className="app">
      {/* Animated Background */}
      <div className="grid-background" />
      
      {/* Hidden video element for camera capture */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        autoPlay
        muted
      />
      
      {/* Header */}
      <motion.header
        className="app-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <div className="header-logo">
            <img src="/phantome-logo.svg" alt="Phantome Logo" className="logo-image" />
            <div className="header-title-group">
              <h1 className="app-title">
                <span className="neon-text">Phantome</span>
              </h1>
              <p className="app-subtitle">
                Advanced Hand Gesture Recognition Platform
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="app-main">
        {/* Left Sidebar - Controls */}
        <aside className="sidebar-left">
          <ControlPanel
            isCameraActive={cameraActive}
            isConnected={isConnected}
            connectionState={connectionState}
            onStartCamera={handleStartCamera}
            onStopCamera={handleStopCamera}
            onReset={handleReset}
            onUploadClick={() => setUploadModalOpen(true)}
            onAnalyticsClick={() => setAnalyticsOpen(true)}
          />
          
          <PerformanceHUD metrics={metrics} isLive={isConnected} />
        </aside>

        {/* Center - Video Feed */}
        <section className="main-content">
          <motion.div
            className="video-container"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GestureCanvas
              videoRef={videoRef}
              isCameraActive={isCameraActive}
              frameImage={frameImage}
              hands={frameAnalysis?.hands || []}
              backendStatus={backendStatus}
              backendError={wsError}
              width={640}
              height={480}
            />
          </motion.div>
        </section>

        {/* Right Sidebar - Gesture Dashboard */}
        <aside className="sidebar-right">
          <GestureDashboard
            gestures={recentGestures}
            currentGesture={currentGesture}
          />
        </aside>
      </main>

      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={(response) => {
          console.log('Video uploaded successfully:', response);
          // Video processing would be implemented here in future versions
          // Could include: Real-time processing status, frame-by-frame analysis display,
          // or batch processing with result download
        }}
      />

      {/* Permission Modal */}
      <PermissionModal
        isOpen={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        onPermissionGranted={handlePermissionGranted}
      />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />

      {/* Footer */}
      <motion.footer
        className="app-footer"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p>
          Phantome &copy; {new Date().getFullYear()} - Powered by React, TypeScript, FastAPI & MediaPipe
        </p>
      </motion.footer>
    </div>
  );
}

export default App;
