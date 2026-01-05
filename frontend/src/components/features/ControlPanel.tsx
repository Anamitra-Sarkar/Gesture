/**
 * Control Panel for camera and system controls
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Settings,
  Upload,
  BarChart3,
} from 'lucide-react';
import './ControlPanel.css';

interface ControlPanelProps {
  isCameraActive: boolean;
  isConnected: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onReset: () => void;
  onUploadClick: () => void;
  onAnalyticsClick?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isCameraActive,
  isConnected,
  onStartCamera,
  onStopCamera,
  onReset,
  onUploadClick,
  onAnalyticsClick,
}) => {
  return (
    <motion.div
      className="control-panel glass-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="control-panel-header">
        <Settings size={20} />
        <h3>Controls</h3>
      </div>

      <div className="control-buttons">
        {/* Camera Toggle */}
        {!isCameraActive ? (
          <motion.button
            className="control-btn btn-primary"
            onClick={onStartCamera}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Camera size={20} />
            <span>Start Camera</span>
          </motion.button>
        ) : (
          <motion.button
            className="control-btn btn-danger"
            onClick={onStopCamera}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CameraOff size={20} />
            <span>Stop Camera</span>
          </motion.button>
        )}

        {/* Reset Button */}
        <motion.button
          className="control-btn"
          onClick={onReset}
          disabled={!isConnected}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw size={20} />
          <span>Reset Tracking</span>
        </motion.button>

        {/* Upload Video Button */}
        <motion.button
          className="control-btn"
          onClick={onUploadClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Upload size={20} />
          <span>Upload Video</span>
        </motion.button>

        {/* Analytics Button */}
        {onAnalyticsClick && (
          <motion.button
            className="control-btn"
            onClick={onAnalyticsClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart3 size={20} />
            <span>Analytics</span>
          </motion.button>
        )}
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <motion.div
            className="status-dot"
            animate={isConnected ? {
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </motion.div>
  );
};
