/**
 * Gesture Dashboard - displays detected gestures with animations
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DetectedGesture, GestureType } from '../../types';
import { Hand, Activity } from 'lucide-react';
import './GestureDashboard.css';

interface GestureDashboardProps {
  gestures: DetectedGesture[];
  currentGesture?: DetectedGesture;
}

const gestureEmojis: Record<GestureType, string> = {
  [GestureType.UNKNOWN]: '❓',
  [GestureType.OPEN_PALM]: '✋',
  [GestureType.FIST]: '✊',
  [GestureType.PINCH]: '🤏',
  [GestureType.POINTING]: '👉',
  [GestureType.THUMBS_UP]: '👍',
  [GestureType.THUMBS_DOWN]: '👎',
  [GestureType.PEACE]: '✌️',
  [GestureType.OK_SIGN]: '👌',
};

const gestureNames: Record<GestureType, string> = {
  [GestureType.UNKNOWN]: 'Unknown',
  [GestureType.OPEN_PALM]: 'Open Palm',
  [GestureType.FIST]: 'Fist',
  [GestureType.PINCH]: 'Pinch',
  [GestureType.POINTING]: 'Pointing',
  [GestureType.THUMBS_UP]: 'Thumbs Up',
  [GestureType.THUMBS_DOWN]: 'Thumbs Down',
  [GestureType.PEACE]: 'Peace',
  [GestureType.OK_SIGN]: 'OK Sign',
};

export const GestureDashboard: React.FC<GestureDashboardProps> = ({
  gestures,
  currentGesture,
}) => {
  return (
    <div className="gesture-dashboard">
      {/* Current Gesture Display */}
      <div className="current-gesture-panel glass-card">
        <div className="panel-header">
          <Hand size={20} />
          <h3>Current Gesture</h3>
        </div>
        
        <AnimatePresence mode="wait">
          {currentGesture ? (
            <motion.div
              key={currentGesture.timestamp}
              className="current-gesture-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="gesture-emoji"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                {gestureEmojis[currentGesture.gesture_type]}
              </motion.div>
              
              <div className="gesture-info">
                <h2 className="gesture-name neon-text">
                  {gestureNames[currentGesture.gesture_type]}
                </h2>
                <p className="gesture-hand">{currentGesture.hand} Hand</p>
              </div>
              
              {/* Confidence Meter */}
              <div className="confidence-meter">
                <div className="confidence-label">
                  <span>Confidence</span>
                  <span className="confidence-value">
                    {(currentGesture.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="confidence-bar-container">
                  <motion.div
                    className="confidence-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentGesture.confidence * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="no-gesture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hand size={48} className="no-gesture-icon" />
              <p>No gesture detected</p>
              <p className="hint">Show your hand to the camera</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent Gestures List */}
      <div className="recent-gestures-panel glass-card">
        <div className="panel-header">
          <Activity size={20} />
          <h3>Recent Gestures</h3>
        </div>
        
        <div className="recent-gestures-list">
          <AnimatePresence>
            {gestures.map((gesture, index) => (
              <motion.div
                key={`${gesture.timestamp}-${index}`}
                className="gesture-item"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="gesture-item-emoji">
                  {gestureEmojis[gesture.gesture_type]}
                </span>
                <div className="gesture-item-info">
                  <span className="gesture-item-name">
                    {gestureNames[gesture.gesture_type]}
                  </span>
                  <span className="gesture-item-meta">
                    {gesture.hand} • {(gesture.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="gesture-item-time">
                  {new Date(gesture.timestamp * 1000).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {gestures.length === 0 && (
            <div className="no-history">
              <p>No gestures detected yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
