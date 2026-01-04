# Architecture Documentation

## System Overview

The Hand Gesture Recognition Platform is a full-stack application built with a microservices-oriented architecture, featuring real-time computer vision processing, WebSocket communication, and an animated frontend.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     User Interface Layer                      │
│                   (React + TypeScript + Vite)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Control    │  │   Canvas     │  │    Gesture       │  │
│  │   Panel      │  │   Renderer   │  │   Dashboard      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                    REST + WebSocket
                           │
┌──────────────────────────┴───────────────────────────────────┐
│                      API Gateway Layer                        │
│                        (FastAPI)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Camera API  │  │  Video API   │  │   WebSocket      │  │
│  │  Endpoints   │  │  Endpoints   │  │   Streaming      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                    Service Layer
                           │
┌──────────────────────────┴───────────────────────────────────┐
│                     Business Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Camera     │  │    Video     │  │   Hand Tracking  │  │
│  │   Service    │  │   Service    │  │     Engine       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                    CV Processing
                           │
┌──────────────────────────┴───────────────────────────────────┐
│                    Computer Vision Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  MediaPipe   │  │  Landmark    │  │    Gesture       │  │
│  │   Hands      │  │  Smoother    │  │  Recognizer      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend Architecture

#### 1. **Component Structure**

```
src/
├── components/
│   ├── features/          # Feature components
│   │   ├── GestureCanvas.tsx
│   │   ├── GestureDashboard.tsx
│   │   ├── PerformanceHUD.tsx
│   │   ├── ControlPanel.tsx
│   │   └── VideoUploadModal.tsx
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
│   ├── useWebSocket.ts
│   └── useGestureTracking.ts
├── services/              # API communication
│   └── api.ts
├── types/                 # TypeScript definitions
│   └── index.ts
└── styles/               # Global styles
    └── global.css
```

#### 2. **State Management**

- **Local State**: React hooks (useState, useEffect)
- **Custom Hooks**: Encapsulate complex logic
  - `useWebSocket`: Manages WebSocket connection
  - `useGestureTracking`: Tracks gesture history and metrics

#### 3. **Data Flow**

```
User Action → Component → API Service → Backend
     ↓                                      ↓
State Update ← WebSocket ← Processing ← CV Engine
```

### Backend Architecture

#### 1. **Service Layer**

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── camera.py     # Camera control
│   │   ├── video.py      # Video processing
│   │   └── websocket.py  # Real-time streaming
│   ├── services/         # Business logic
│   │   ├── camera_service.py
│   │   ├── video_service.py
│   │   └── hand_tracking.py
│   ├── models/           # Data models
│   │   └── schemas.py
│   ├── core/             # Core functionality
│   │   ├── config.py
│   │   └── logging.py
│   └── utils/            # Utility functions
├── main.py               # Application entry
└── uploads/              # Video storage
```

#### 2. **Processing Pipeline**

```
Camera/Video Input
    ↓
Frame Capture
    ↓
Color Conversion (BGR → RGB)
    ↓
MediaPipe Processing
    ↓
Landmark Extraction
    ↓
Landmark Smoothing (Exponential Moving Average)
    ↓
Gesture Recognition (Rule-based)
    ↓
Temporal Consistency Check
    ↓
Result Packaging
    ↓
WebSocket Transmission / API Response
```

#### 3. **Gesture Recognition Algorithm**

Each gesture uses a combination of:

1. **Geometric Analysis**
   - Finger extension detection (tip vs base position)
   - Angle calculation between joints
   - Distance measurements

2. **Confidence Scoring**
   - Rule-based scoring (0.0 - 1.0)
   - Threshold filtering
   - Temporal consistency

3. **Example: Open Palm Detection**

```python
def _detect_open_palm(landmarks):
    extended_fingers = 0
    
    # Check each finger
    for finger in [thumb, index, middle, ring, pinky]:
        if is_extended(finger_landmarks):
            extended_fingers += 1
    
    confidence = extended_fingers / 5.0
    return min(confidence, 1.0)
```

## Communication Protocols

### REST API

**Endpoints:**

```
GET  /                    # API information
GET  /health              # Health check
POST /camera/start        # Start camera
POST /camera/stop         # Stop camera
GET  /camera/status       # Camera status
POST /camera/reset        # Reset tracking
POST /video/upload        # Upload video
GET  /video/info/{id}     # Video metadata
DELETE /video/{id}        # Delete video
```

### WebSocket Protocol

**Message Format:**

```json
{
  "message_type": "frame_analysis",
  "data": {
    "frame_analysis": {
      "frame_number": 123,
      "timestamp": 1234567890.123,
      "hands": [...],
      "gestures": [...],
      "fps": 28.5,
      "processing_time_ms": 18.3
    },
    "frame_image": "base64_encoded_jpeg"
  },
  "timestamp": 1234567890.123
}
```

## Data Models

### Core Types

```typescript
interface HandLandmarks {
  landmarks: LandmarkPoint[];     // 21 points
  handedness: string;             // "Left" or "Right"
  handedness_confidence: number;  // 0.0 - 1.0
}

interface DetectedGesture {
  gesture_type: GestureType;
  confidence: number;
  hand: string;
  timestamp: number;
}

interface FrameAnalysis {
  frame_number: number;
  timestamp: number;
  hands: HandLandmarks[];
  gestures: DetectedGesture[];
  fps?: number;
  processing_time_ms?: number;
}
```

## Performance Optimizations

### Backend

1. **Async Processing**: Non-blocking I/O with FastAPI
2. **Frame Skipping**: Configurable frame processing rate
3. **Landmark Smoothing**: Reduces jitter without latency
4. **Efficient Encoding**: JPEG compression for transmission
5. **Connection Pooling**: Reuse MediaPipe instances

### Frontend

1. **Canvas Rendering**: Hardware-accelerated drawing
2. **Frame Buffering**: Smooth playback without drops
3. **Lazy Loading**: Components load on demand
4. **Code Splitting**: Vite automatic splitting
5. **CSS Animations**: GPU-accelerated transitions

## Scalability Considerations

### Horizontal Scaling

- Stateless API design
- WebSocket session management
- Load balancer compatible

### Vertical Scaling

- Adjustable processing parameters
- Model complexity settings
- Resolution/FPS controls

## Security

### Backend

- CORS configuration
- Input validation (Pydantic)
- File size limits
- Type checking

### Frontend

- XSS protection
- Content Security Policy
- Secure WebSocket (WSS in production)
- Environment variable management

## Deployment

### Development

```bash
# Backend
cd backend && python main.py

# Frontend
cd frontend && npm run dev
```

### Production

```bash
# Docker Compose
docker-compose up -d

# Or separate services
docker build -t gesture-backend ./backend
docker build -t gesture-frontend ./frontend
```

## Monitoring & Logging

### Backend Logging

```python
# app/core/logging.py
- Request/response logging
- Error tracking
- Performance metrics
- Debug mode support
```

### Frontend Monitoring

```typescript
// Performance tracking
- FPS monitoring
- Latency measurement
- Gesture detection counters
- Error boundaries
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend UI | React 18 | Component-based UI |
| Type Safety | TypeScript | Static typing |
| Animations | Framer Motion | Smooth transitions |
| Build Tool | Vite | Fast development |
| Backend API | FastAPI | Async web framework |
| CV Processing | MediaPipe | Hand tracking |
| Image Processing | OpenCV | Frame manipulation |
| Real-time | WebSocket | Live streaming |
| Validation | Pydantic | Data schemas |
| Server | Uvicorn | ASGI server |

## Future Architecture Enhancements

1. **ML Model Integration**
   - Custom gesture training
   - TensorFlow.js for client-side inference
   - Model versioning

2. **Caching Layer**
   - Redis for session management
   - Result caching

3. **Message Queue**
   - RabbitMQ/Kafka for video processing
   - Async job processing

4. **Database Layer**
   - PostgreSQL for user data
   - MongoDB for analytics

5. **Microservices**
   - Separate CV service
   - Authentication service
   - Analytics service

---

**Last Updated:** 2026-01-04  
**Version:** 1.0.0  
**Status:** Production Ready
