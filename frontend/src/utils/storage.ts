/**
 * Storage utilities for persisting application state
 */

const STORAGE_KEYS = {
  GESTURE_HISTORY: 'gesture_history',
  USER_PREFERENCES: 'user_preferences',
  ANALYTICS: 'analytics',
  SESSION_DATA: 'session_data',
} as const;

export interface StoredGesture {
  type: string;
  confidence: number;
  timestamp: number;
  sessionId?: string;
}

export interface UserPreferences {
  showPerformanceHUD: boolean;
  showLandmarks: boolean;
  cameraIndex: number;
  theme?: 'dark' | 'light';
}

export interface AnalyticsData {
  totalGestures: number;
  gesturesByType: Record<string, number>;
  averageConfidence: number;
  sessionCount: number;
  totalRuntime: number;
}

/**
 * Save gesture to history
 */
export function saveGestureToHistory(gesture: StoredGesture): void {
  try {
    const history = getGestureHistory();
    history.push(gesture);
    
    // Keep only last 100 gestures to avoid storage overflow
    const trimmedHistory = history.slice(-100);
    
    localStorage.setItem(STORAGE_KEYS.GESTURE_HISTORY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Failed to save gesture to history:', error);
  }
}

/**
 * Get gesture history from localStorage
 */
export function getGestureHistory(): StoredGesture[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GESTURE_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load gesture history:', error);
    return [];
  }
}

/**
 * Clear gesture history
 */
export function clearGestureHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.GESTURE_HISTORY);
  } catch (error) {
    console.error('Failed to clear gesture history:', error);
  }
}

/**
 * Get gestures filtered by session ID
 */
export function getGesturesBySession(sessionId: string): StoredGesture[] {
  const history = getGestureHistory();
  return history.filter(g => g.sessionId === sessionId);
}

/**
 * Save user preferences
 */
export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  try {
    const current = getUserPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

/**
 * Get user preferences
 */
export function getUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return stored ? JSON.parse(stored) : {
      showPerformanceHUD: true,
      showLandmarks: true,
      cameraIndex: 0,
      theme: 'dark',
    };
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return {
      showPerformanceHUD: true,
      showLandmarks: true,
      cameraIndex: 0,
      theme: 'dark',
    };
  }
}

/**
 * Update analytics data
 */
export function updateAnalytics(gesture: StoredGesture): void {
  try {
    const analytics = getAnalytics();
    
    analytics.totalGestures += 1;
    analytics.gesturesByType[gesture.type] = (analytics.gesturesByType[gesture.type] || 0) + 1;
    
    // Update average confidence
    const totalConfidence = analytics.averageConfidence * (analytics.totalGestures - 1) + gesture.confidence;
    analytics.averageConfidence = totalConfidence / analytics.totalGestures;
    
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
  } catch (error) {
    console.error('Failed to update analytics:', error);
  }
}

/**
 * Get analytics data
 */
export function getAnalytics(): AnalyticsData {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    return stored ? JSON.parse(stored) : {
      totalGestures: 0,
      gesturesByType: {},
      averageConfidence: 0,
      sessionCount: 0,
      totalRuntime: 0,
    };
  } catch (error) {
    console.error('Failed to load analytics:', error);
    return {
      totalGestures: 0,
      gesturesByType: {},
      averageConfidence: 0,
      sessionCount: 0,
      totalRuntime: 0,
    };
  }
}

/**
 * Clear all analytics
 */
export function clearAnalytics(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
  } catch (error) {
    console.error('Failed to clear analytics:', error);
  }
}

/**
 * Create a new session ID
 */
export function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save current session data
 */
export function saveSessionData(sessionId: string, startTime: number): void {
  try {
    const sessionData = {
      sessionId,
      startTime,
      lastActivity: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save session data:', error);
  }
}

/**
 * Get current session data
 */
export function getSessionData(): { sessionId: string; startTime: number; lastActivity: number } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load session data:', error);
    return null;
  }
}

/**
 * Clear all stored data
 */
export function clearAllData(): void {
  clearGestureHistory();
  clearAnalytics();
  localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
}

/**
 * Export gesture history as JSON
 */
export function exportGestureHistory(): string {
  const history = getGestureHistory();
  const analytics = getAnalytics();
  
  return JSON.stringify({
    history,
    analytics,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

/**
 * Import gesture history from JSON
 */
export function importGestureHistory(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.history && Array.isArray(data.history)) {
      localStorage.setItem(STORAGE_KEYS.GESTURE_HISTORY, JSON.stringify(data.history));
    }
    
    if (data.analytics) {
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(data.analytics));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import gesture history:', error);
    return false;
  }
}
