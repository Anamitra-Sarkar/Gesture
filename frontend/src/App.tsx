/**
 * Main Application Component
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GestureCanvas } from './components/features/GestureCanvas';
import { GestureDashboard } from './components/features/GestureDashboard';
import { PerformanceHUD } from './components/features/PerformanceHUD';
import { ControlPanel } from './components/features/ControlPanel';
import { VideoUploadModal } from './components/features/VideoUploadModal';
import { useWebSocket } from './hooks/useWebSocket';
import { useGestureTracking } from './hooks/useGestureTracking';
import { apiService } from './services/api';
import './styles/global.css';
import './App.css';

function App() {
  const [cameraActive, setCameraActive] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  
  const { isConnected, frameAnalysis, frameImage, connect, disconnect } = useWebSocket();
  const { recentGestures, metrics, addGesture, updateMetrics, reset } = useGestureTracking();

  // Process frame analysis data
  useEffect(() => {
    if (frameAnalysis) {
      // Add detected gestures
      frameAnalysis.gestures.forEach((gesture) => {
        addGesture(gesture);
      });

      // Update metrics
      if (frameAnalysis.fps !== undefined && frameAnalysis.processing_time_ms !== undefined) {
        updateMetrics(frameAnalysis.fps, frameAnalysis.processing_time_ms);
      }
    }
  }, [frameAnalysis, addGesture, updateMetrics]);

  const handleStartCamera = async () => {
    try {
      await apiService.startCamera();
      setCameraActive(true);
      connect();
    } catch (error) {
      console.error('Failed to start camera:', error);
      alert('Failed to start camera. Please check if camera is available.');
    }
  };

  const handleStopCamera = async () => {
    try {
      await apiService.stopCamera();
      disconnect();
      setCameraActive(false);
    } catch (error) {
      console.error('Failed to stop camera:', error);
    }
  };

  const handleReset = async () => {
    try {
      await apiService.resetTracking();
      reset();
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
      
      {/* Header */}
      <motion.header
        className="app-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="app-title">
          <span className="neon-text">Hand Gesture</span> Recognition Platform
        </h1>
        <p className="app-subtitle">
          Production-grade computer vision powered by MediaPipe & React
        </p>
      </motion.header>

      {/* Main Content */}
      <main className="app-main">
        {/* Left Sidebar - Controls */}
        <aside className="sidebar-left">
          <ControlPanel
            isCameraActive={cameraActive}
            isConnected={isConnected}
            onStartCamera={handleStartCamera}
            onStopCamera={handleStopCamera}
            onReset={handleReset}
            onUploadClick={() => setUploadModalOpen(true)}
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
              frameImage={frameImage}
              hands={frameAnalysis?.hands || []}
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

      {/* Footer */}
      <motion.footer
        className="app-footer"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p>
          Built with React, TypeScript, FastAPI, MediaPipe & Framer Motion
        </p>
      </motion.footer>
    </div>
  );
}

export default App;
