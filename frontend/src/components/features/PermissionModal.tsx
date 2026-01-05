/**
 * Permission Modal - Handles camera permission requests with clear UX
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertTriangle, Info, X } from 'lucide-react';
import {
  requestCameraPermission,
  checkCameraPermission,
  PermissionState,
  type PermissionStateType,
  type PermissionResult,
  getPermissionInstructions,
  getBrowserInfo,
} from '../../utils/permissions';
import './PermissionModal.css';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
}) => {
  const [permissionState, setPermissionState] = useState<PermissionStateType>(PermissionState.PROMPT);
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cameras, setCameras] = useState<PermissionResult['cameras']>([]);
  const browserInfo = getBrowserInfo();

  // Check permission state when modal opens
  useEffect(() => {
    if (isOpen) {
      checkCurrentPermission();
    }
  }, [isOpen]);

  const checkCurrentPermission = async () => {
    const state = await checkCameraPermission();
    setPermissionState(state);
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setErrorMessage('');

    try {
      const result = await requestCameraPermission();
      setPermissionState(result.state);

      if (result.state === PermissionState.GRANTED) {
        setCameras(result.cameras);
        onPermissionGranted();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error('Permission request error:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const renderContent = () => {
    switch (permissionState) {
      case PermissionState.PROMPT:
        return (
          <>
            <div className="permission-icon">
              <Camera size={48} />
            </div>
            <h2>Camera Access Required</h2>
            <p className="permission-description">
              This application needs access to your camera to perform real-time hand gesture
              recognition. Your camera feed is processed locally and is never stored or
              transmitted.
            </p>
            <div className="permission-info">
              <Info size={16} />
              <span>
                {browserInfo.isMobile
                  ? 'On mobile devices, ensure camera permissions are enabled in your browser settings.'
                  : 'Click "Allow" when your browser prompts for camera access.'}
              </span>
            </div>
            <div className="permission-actions">
              <motion.button
                className="btn-primary"
                onClick={handleRequestPermission}
                disabled={isRequesting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isRequesting ? 'Requesting...' : 'Allow Camera Access'}
              </motion.button>
              <motion.button
                className="btn-secondary"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </>
        );

      case PermissionState.DENIED:
        return (
          <>
            <div className="permission-icon error">
              <AlertTriangle size={48} />
            </div>
            <h2>Camera Access Denied</h2>
            <p className="permission-description">
              {errorMessage ||
                'Camera permission was denied. To use this feature, you need to allow camera access.'}
            </p>
            <div className="permission-info warning">
              <Info size={16} />
              <span>{getPermissionInstructions()}</span>
            </div>
            <div className="permission-actions">
              <motion.button
                className="btn-primary"
                onClick={handleRequestPermission}
                disabled={isRequesting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
              <motion.button
                className="btn-secondary"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </div>
          </>
        );

      case PermissionState.UNAVAILABLE:
        return (
          <>
            <div className="permission-icon error">
              <AlertTriangle size={48} />
            </div>
            <h2>Camera Unavailable</h2>
            <p className="permission-description">
              {errorMessage || 'No camera was detected on this device.'}
            </p>
            <div className="permission-info warning">
              <Info size={16} />
              <span>
                Please ensure:
                <ul>
                  <li>A camera is connected to your device</li>
                  <li>No other application is using the camera</li>
                  <li>Your browser supports camera access</li>
                </ul>
              </span>
            </div>
            <div className="permission-actions">
              <motion.button
                className="btn-primary"
                onClick={handleRequestPermission}
                disabled={isRequesting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retry
              </motion.button>
              <motion.button
                className="btn-secondary"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </div>
          </>
        );

      case PermissionState.GRANTED:
        return (
          <>
            <div className="permission-icon success">
              <Camera size={48} />
            </div>
            <h2>Camera Access Granted</h2>
            <p className="permission-description">
              Successfully connected to your camera. Starting hand tracking...
            </p>
            {cameras && cameras.length > 0 && (
              <div className="camera-list">
                <p className="camera-list-title">Available Cameras:</p>
                {cameras.map((camera, index) => (
                  <div key={camera.deviceId} className="camera-item">
                    <Camera size={16} />
                    <span>{camera.label || `Camera ${index + 1}`}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="permission-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="permission-modal glass-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="permission-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
