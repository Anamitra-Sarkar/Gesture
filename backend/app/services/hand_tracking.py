"""
Advanced hand tracking and gesture recognition engine using MediaPipe.
"""
import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, List, Tuple
import logging
from dataclasses import dataclass, field
from collections import deque
import math

from ..models.schemas import GestureType, LandmarkPoint, HandLandmarks, DetectedGesture
from ..core.config import settings


logger = logging.getLogger(__name__)


@dataclass
class HandTrackingResult:
    """Result from hand tracking processing."""
    landmarks: List[HandLandmarks] = field(default_factory=list)
    gestures: List[DetectedGesture] = field(default_factory=list)
    annotated_frame: Optional[np.ndarray] = None
    processing_time_ms: float = 0.0


class LandmarkSmoother:
    """Smooth landmark positions to reduce jitter."""
    
    def __init__(self, smoothing_factor: float = 0.3, window_size: int = 5):
        self.smoothing_factor = smoothing_factor
        self.history = deque(maxlen=window_size)
    
    def smooth(self, landmarks: List[List[float]]) -> List[List[float]]:
        """
        Apply exponential moving average smoothing.
        
        Args:
            landmarks: Current frame landmarks (21 points x 3 coordinates)
            
        Returns:
            Smoothed landmarks
        """
        if not self.history:
            self.history.append(landmarks)
            return landmarks
        
        # Exponential moving average
        prev_landmarks = self.history[-1]
        smoothed = []
        
        for curr, prev in zip(landmarks, prev_landmarks):
            smoothed_point = [
                prev[i] * self.smoothing_factor + curr[i] * (1 - self.smoothing_factor)
                for i in range(3)
            ]
            smoothed.append(smoothed_point)
        
        self.history.append(smoothed)
        return smoothed
    
    def reset(self):
        """Reset smoothing history."""
        self.history.clear()


class GestureRecognizer:
    """
    Intelligent gesture recognition based on hand landmark geometry.
    Supports multiple gesture types with confidence scoring.
    """
    
    def __init__(self, confidence_threshold: float = 0.75):
        self.confidence_threshold = confidence_threshold
        self.gesture_history = deque(maxlen=settings.GESTURE_TEMPORAL_WINDOW)
    
    def recognize(self, hand_landmarks: List[List[float]], handedness: str) -> Optional[DetectedGesture]:
        """
        Recognize gesture from hand landmarks.
        
        Args:
            hand_landmarks: 21 landmarks (x, y, z)
            handedness: "Left" or "Right"
            
        Returns:
            Detected gesture with confidence or None
        """
        # Convert to numpy for easier calculations
        landmarks = np.array(hand_landmarks)
        
        # Detect various gestures
        gesture_scores = {
            GestureType.OPEN_PALM: self._detect_open_palm(landmarks),
            GestureType.FIST: self._detect_fist(landmarks),
            GestureType.PINCH: self._detect_pinch(landmarks),
            GestureType.POINTING: self._detect_pointing(landmarks),
            GestureType.THUMBS_UP: self._detect_thumbs_up(landmarks),
            GestureType.THUMBS_DOWN: self._detect_thumbs_down(landmarks),
            GestureType.PEACE: self._detect_peace(landmarks),
            GestureType.OK_SIGN: self._detect_ok_sign(landmarks),
        }
        
        # Find gesture with highest confidence
        best_gesture = max(gesture_scores.items(), key=lambda x: x[1])
        gesture_type, confidence = best_gesture
        
        # Apply temporal consistency
        self.gesture_history.append((gesture_type, confidence))
        
        if confidence > self.confidence_threshold:
            # Check temporal consistency
            recent_gestures = [g[0] for g in self.gesture_history]
            most_common = max(set(recent_gestures), key=recent_gestures.count)
            
            if most_common == gesture_type:
                return DetectedGesture(
                    gesture_type=gesture_type,
                    confidence=confidence,
                    hand=handedness,
                    timestamp=0.0  # Will be set by caller
                )
        
        return None
    
    def _calculate_distance(self, p1: np.ndarray, p2: np.ndarray) -> float:
        """Calculate Euclidean distance between two 3D points."""
        return np.linalg.norm(p1 - p2)
    
    def _calculate_angle(self, p1: np.ndarray, p2: np.ndarray, p3: np.ndarray) -> float:
        """Calculate angle at p2 formed by p1-p2-p3."""
        v1 = p1 - p2
        v2 = p3 - p2
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        return np.arccos(cos_angle) * 180 / np.pi
    
    def _is_finger_extended(self, landmarks: np.ndarray, finger_indices: List[int]) -> bool:
        """Check if a finger is extended based on landmark positions."""
        # Check if tip is above the base
        tip_y = landmarks[finger_indices[-1]][1]
        base_y = landmarks[finger_indices[0]][1]
        
        # Also check if finger is relatively straight
        angles = []
        for i in range(len(finger_indices) - 2):
            angle = self._calculate_angle(
                landmarks[finger_indices[i]],
                landmarks[finger_indices[i + 1]],
                landmarks[finger_indices[i + 2]]
            )
            angles.append(angle)
        
        avg_angle = np.mean(angles)
        return tip_y < base_y and avg_angle > 140  # Relatively straight
    
    def _detect_open_palm(self, landmarks: np.ndarray) -> float:
        """Detect open palm gesture."""
        # All fingers should be extended
        fingers = {
            "thumb": [1, 2, 3, 4],
            "index": [5, 6, 7, 8],
            "middle": [9, 10, 11, 12],
            "ring": [13, 14, 15, 16],
            "pinky": [17, 18, 19, 20]
        }
        
        extended_count = 0
        for finger_name, indices in fingers.items():
            if finger_name == "thumb":
                # Special check for thumb (horizontal extension)
                if landmarks[4][0] < landmarks[2][0] - 0.05:  # Left hand logic
                    extended_count += 1
            else:
                if self._is_finger_extended(landmarks, indices):
                    extended_count += 1
        
        confidence = extended_count / 5.0
        return min(confidence, 1.0)
    
    def _detect_fist(self, landmarks: np.ndarray) -> float:
        """Detect fist gesture."""
        # All fingertips should be close to palm center
        palm_center = landmarks[0]  # Wrist as reference
        
        fingertips = [4, 8, 12, 16, 20]
        distances = [self._calculate_distance(landmarks[tip], palm_center) for tip in fingertips]
        avg_distance = np.mean(distances)
        
        # Fist has small average distance
        confidence = max(0, 1 - (avg_distance / 0.3))
        return min(confidence, 1.0)
    
    def _detect_pinch(self, landmarks: np.ndarray) -> float:
        """Detect pinch gesture (thumb and index finger touching)."""
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        
        distance = self._calculate_distance(thumb_tip, index_tip)
        
        # Check other fingers are not extended
        other_fingers_closed = (
            landmarks[12][1] > landmarks[9][1] and  # Middle
            landmarks[16][1] > landmarks[13][1] and  # Ring
            landmarks[20][1] > landmarks[17][1]  # Pinky
        )
        
        confidence = max(0, 1 - (distance / 0.1))
        if other_fingers_closed:
            confidence *= 1.2
        
        return min(confidence, 1.0)
    
    def _detect_pointing(self, landmarks: np.ndarray) -> float:
        """Detect pointing gesture (index finger extended, others closed)."""
        index_extended = self._is_finger_extended(landmarks, [5, 6, 7, 8])
        
        # Other fingers should be closed
        middle_closed = landmarks[12][1] > landmarks[9][1]
        ring_closed = landmarks[16][1] > landmarks[13][1]
        pinky_closed = landmarks[20][1] > landmarks[17][1]
        
        if index_extended and middle_closed and ring_closed and pinky_closed:
            return 0.9
        elif index_extended:
            return 0.6
        else:
            return 0.0
    
    def _detect_thumbs_up(self, landmarks: np.ndarray) -> float:
        """Detect thumbs up gesture."""
        # Thumb should be extended upward
        thumb_tip = landmarks[4]
        thumb_base = landmarks[2]
        
        # Thumb tip should be significantly above base
        if thumb_tip[1] < thumb_base[1] - 0.1:
            # Other fingers should be closed
            fingers_closed = all([
                landmarks[8][1] > landmarks[6][1],   # Index
                landmarks[12][1] > landmarks[10][1],  # Middle
                landmarks[16][1] > landmarks[14][1],  # Ring
                landmarks[20][1] > landmarks[18][1]   # Pinky
            ])
            
            if fingers_closed:
                return 0.85
            else:
                return 0.5
        
        return 0.0
    
    def _detect_thumbs_down(self, landmarks: np.ndarray) -> float:
        """Detect thumbs down gesture."""
        # Thumb should be extended downward
        thumb_tip = landmarks[4]
        thumb_base = landmarks[2]
        
        # Thumb tip should be significantly below base
        if thumb_tip[1] > thumb_base[1] + 0.1:
            # Other fingers should be closed
            fingers_closed = all([
                landmarks[8][1] > landmarks[6][1],   # Index
                landmarks[12][1] > landmarks[10][1],  # Middle
                landmarks[16][1] > landmarks[14][1],  # Ring
                landmarks[20][1] > landmarks[18][1]   # Pinky
            ])
            
            if fingers_closed:
                return 0.85
            else:
                return 0.5
        
        return 0.0
    
    def _detect_peace(self, landmarks: np.ndarray) -> float:
        """Detect peace sign (index and middle fingers extended)."""
        index_extended = self._is_finger_extended(landmarks, [5, 6, 7, 8])
        middle_extended = self._is_finger_extended(landmarks, [9, 10, 11, 12])
        
        ring_closed = landmarks[16][1] > landmarks[13][1]
        pinky_closed = landmarks[20][1] > landmarks[17][1]
        
        if index_extended and middle_extended and ring_closed and pinky_closed:
            return 0.85
        elif index_extended and middle_extended:
            return 0.6
        else:
            return 0.0
    
    def _detect_ok_sign(self, landmarks: np.ndarray) -> float:
        """Detect OK sign (thumb and index forming circle)."""
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        
        # Thumb and index should be close
        distance = self._calculate_distance(thumb_tip, index_tip)
        
        # Other fingers should be extended
        middle_extended = self._is_finger_extended(landmarks, [9, 10, 11, 12])
        ring_extended = self._is_finger_extended(landmarks, [13, 14, 15, 16])
        
        if distance < 0.05 and middle_extended and ring_extended:
            return 0.85
        elif distance < 0.05:
            return 0.6
        else:
            return 0.0


class HandTrackingEngine:
    """
    Production-grade hand tracking engine with MediaPipe.
    Features: Multi-hand detection, landmark smoothing, gesture recognition.
    """
    
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.hands = None
        self.smoothers = {}  # One smoother per hand
        self.gesture_recognizer = GestureRecognizer(settings.GESTURE_CONFIDENCE_THRESHOLD)
        
        self._initialize_detector()
        logger.info("Hand tracking engine initialized")
    
    def _initialize_detector(self):
        """Initialize MediaPipe Hands detector."""
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=settings.MP_MAX_NUM_HANDS,
            model_complexity=settings.MP_MODEL_COMPLEXITY,
            min_detection_confidence=settings.MP_MIN_DETECTION_CONFIDENCE,
            min_tracking_confidence=settings.MP_MIN_TRACKING_CONFIDENCE
        )
    
    def process_frame(self, frame: np.ndarray, draw_landmarks: bool = True) -> HandTrackingResult:
        """
        Process a single frame for hand tracking and gesture recognition.
        
        Args:
            frame: Input frame (BGR format)
            draw_landmarks: Whether to draw landmarks on frame
            
        Returns:
            HandTrackingResult with landmarks, gestures, and annotated frame
        """
        import time
        start_time = time.time()
        
        # Convert to RGB for MediaPipe
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)
        
        hand_landmarks_list = []
        detected_gestures = []
        annotated_frame = frame.copy() if draw_landmarks else None
        
        if results.multi_hand_landmarks and results.multi_handedness:
            for idx, (hand_landmarks, handedness) in enumerate(
                zip(results.multi_hand_landmarks, results.multi_handedness)
            ):
                # Extract handedness
                hand_label = handedness.classification[0].label
                hand_confidence = handedness.classification[0].score
                
                # Extract landmarks
                landmarks_raw = [
                    [lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark
                ]
                
                # Apply smoothing
                hand_key = f"{hand_label}_{idx}"
                if hand_key not in self.smoothers:
                    self.smoothers[hand_key] = LandmarkSmoother(settings.LANDMARK_SMOOTHING_FACTOR)
                
                landmarks_smoothed = self.smoothers[hand_key].smooth(landmarks_raw)
                
                # Create HandLandmarks object
                hand_landmarks_obj = HandLandmarks(
                    landmarks=[
                        LandmarkPoint(x=lm[0], y=lm[1], z=lm[2])
                        for lm in landmarks_smoothed
                    ],
                    handedness=hand_label,
                    handedness_confidence=hand_confidence
                )
                hand_landmarks_list.append(hand_landmarks_obj)
                
                # Gesture recognition
                gesture = self.gesture_recognizer.recognize(landmarks_smoothed, hand_label)
                if gesture:
                    gesture.timestamp = time.time()
                    detected_gestures.append(gesture)
                
                # Draw landmarks if requested
                if draw_landmarks and annotated_frame is not None:
                    self.mp_drawing.draw_landmarks(
                        annotated_frame,
                        hand_landmarks,
                        self.mp_hands.HAND_CONNECTIONS,
                        self.mp_drawing_styles.get_default_hand_landmarks_style(),
                        self.mp_drawing_styles.get_default_hand_connections_style()
                    )
                    
                    # Add gesture label
                    if gesture:
                        h, w, _ = annotated_frame.shape
                        wrist = hand_landmarks.landmark[0]
                        x, y = int(wrist.x * w), int(wrist.y * h)
                        
                        label = f"{gesture.gesture_type.value}: {gesture.confidence:.2f}"
                        cv2.putText(
                            annotated_frame, label, (x, y - 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2
                        )
        
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return HandTrackingResult(
            landmarks=hand_landmarks_list,
            gestures=detected_gestures,
            annotated_frame=annotated_frame,
            processing_time_ms=processing_time
        )
    
    def reset(self):
        """Reset the tracking engine state."""
        self.smoothers.clear()
        self.gesture_recognizer.gesture_history.clear()
        logger.info("Hand tracking engine reset")
    
    def close(self):
        """Clean up resources."""
        if self.hands:
            self.hands.close()
        logger.info("Hand tracking engine closed")
