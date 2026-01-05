/**
 * Analytics Dashboard - Enhanced gesture statistics and history
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Download,
  Trash2,
  Clock,
} from 'lucide-react';
import {
  getGestureHistory,
  getAnalytics,
  clearGestureHistory,
  clearAnalytics,
  exportGestureHistory,
  type StoredGesture,
  type AnalyticsData,
} from '../../utils/storage';
import './AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<StoredGesture[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setHistory(getGestureHistory());
    setAnalytics(getAnalytics());
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all gesture history? This cannot be undone.')) {
      clearGestureHistory();
      clearAnalytics();
      loadData();
    }
  };

  const handleExport = () => {
    const data = exportGestureHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gesture-history-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTopGestures = () => {
    if (!analytics) return [];
    const entries = Object.entries(analytics.gesturesByType);
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="analytics-dashboard-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="analytics-dashboard glass-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="analytics-header">
          <h2>
            <BarChart3 size={24} />
            Analytics Dashboard
          </h2>
          <div className="analytics-actions">
            <motion.button
              className="btn-icon"
              onClick={handleExport}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Export Data"
            >
              <Download size={20} />
            </motion.button>
            <motion.button
              className="btn-icon danger"
              onClick={handleClearHistory}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Clear History"
            >
              <Trash2 size={20} />
            </motion.button>
            <motion.button
              className="btn-icon"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </div>
        </div>

        <div className="analytics-tabs">
          <button
            className={`tab ${selectedTab === 'overview' ? 'active' : ''}`}
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${selectedTab === 'history' ? 'active' : ''}`}
            onClick={() => setSelectedTab('history')}
          >
            History ({history.length})
          </button>
        </div>

        <div className="analytics-content">
          {selectedTab === 'overview' && analytics && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Activity size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{analytics.totalGestures}</div>
                    <div className="stat-label">Total Gestures</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {(analytics.averageConfidence * 100).toFixed(1)}%
                    </div>
                    <div className="stat-label">Avg Confidence</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Clock size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{analytics.sessionCount}</div>
                    <div className="stat-label">Sessions</div>
                  </div>
                </div>
              </div>

              <div className="top-gestures">
                <h3>Top Gestures</h3>
                {getTopGestures().length > 0 ? (
                  <div className="gesture-bars">
                    {getTopGestures().map(([gesture, count]) => {
                      const maxCount = Math.max(...getTopGestures().map(([, c]) => c));
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={gesture} className="gesture-bar-item">
                          <div className="gesture-bar-label">
                            <span className="gesture-name">{gesture}</span>
                            <span className="gesture-count">{count}</span>
                          </div>
                          <div className="gesture-bar-bg">
                            <motion.div
                              className="gesture-bar-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-data">No gesture data available yet</p>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'history' && (
            <div className="history-tab">
              {history.length > 0 ? (
                <div className="history-list">
                  {history.slice().reverse().map((gesture, index) => (
                    <motion.div
                      key={index}
                      className="history-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div className="history-gesture">
                        <span className="gesture-type">{gesture.type}</span>
                        <span className="gesture-confidence">
                          {(gesture.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="history-time">
                        {formatTime(gesture.timestamp)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="no-data-container">
                  <Activity size={48} />
                  <p className="no-data">No gesture history yet</p>
                  <p className="no-data-hint">
                    Start using the camera to track gestures
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
