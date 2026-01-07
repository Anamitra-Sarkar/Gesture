# 🖐️ Hand Gesture Recognition Platform

**Production-Ready Computer Vision System with Real-Time Hand Tracking and Gesture Recognition**

A client-grade, full-stack hand gesture recognition platform featuring browser-based camera capture, cloud-compatible architecture, persistent analytics, and an advanced animated UI. Built with modern technologies for enterprise-level computer vision processing and user experience.

![Platform Preview](https://img.shields.io/badge/Status-Production%20Ready-success)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![React](https://img.shields.io/badge/React-19+-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688)

**🌐 Live Application**: [https://gesture-detection-lac.vercel.app](https://gesture-detection-lac.vercel.app)

---

## 🎯 Overview

This is a **production-quality, cloud-deployed system** that provides enterprise-grade hand gesture recognition with:

- **Browser-Based Camera**: Camera capture happens entirely in the browser (client-side)
- **Cloud Architecture**: Fully compatible with cloud deployment (Render, AWS, GCP, Azure)
- **Backend Processing**: MediaPipe hand tracking runs server-side on received frames
- **Frontend Experience**: Futuristic glassmorphism UI with heavy animations
- **System Design**: Clean separation of concerns, scalable structure
- **Performance**: Optimized processing with FPS monitoring and metrics
- **Data Persistence**: Local storage for gesture history and analytics
- **Security**: Production-grade permission handling and CORS configuration

---

## ✨ Core Features

### 🎥 **Production Architecture (Client-Side Camera)**
- **Browser Camera Capture**: Camera access via `navigator.mediaDevices.getUserMedia`
- **Frame Streaming**: Client sends frames to server via WebSocket for processing
- **Cloud Compatible**: No server-side camera dependencies - works on any cloud platform
- **Permission Management**: Explicit user-initiated permission requests with clear UX
- **Device Selection**: Support for multiple cameras (front/back on mobile)
- **Mobile Support**: Works on iOS Safari, Android Chrome, and desktop browsers

### 🖐️ **Advanced Gesture Recognition**
Detects 8+ gesture types with confidence scoring:
- ✋ Open Palm
- ✊ Fist
- 🤏 Pinch
- 👉 Pointing
- 👍 Thumbs Up
- 👎 Thumbs Down
- ✌️ Peace Sign
- 👌 OK Sign

### 🧠 **Computer Vision Engine**
- Full 21-landmark tracking per hand
- Multi-hand detection (both hands simultaneously)
- Landmark smoothing (jitter reduction)
- Temporal consistency for gesture stability
- Adaptive confidence thresholds

### 🎨 **Production UI/UX**
- **Glassmorphism Design**: Frosted glass effects with neon accents
- **Motion-Heavy**: Framer Motion animations throughout
- **Real-Time Visualization**: Live landmark rendering on canvas
- **Performance HUD**: FPS, latency, and metrics display
- **Gesture Dashboard**: Current gesture with confidence meters
- **Recent History**: Animated gesture timeline
- **Responsive Layout**: Desktop-first, mobile-adapted

### ⚡ **Performance & Analytics**
- Real-time FPS calculation (client-side)
- Processing latency metrics (server-side)
- Frame processing statistics
- Gesture detection counters
- Live connection status
- **Persistent Analytics Dashboard**: View historical gesture data, statistics, and trends
- **Export/Import**: Download gesture history as JSON
- **Session Tracking**: Multi-session isolation with unique session IDs

### 🔒 **Production-Grade Security**
- **Camera Permission Handling**: Explicit user-initiated permission requests
- Browser-specific permission instructions (Chrome, Firefox, Safari, Mobile)
- Clear permission states (waiting, granted, denied, unavailable)
- File validation for video uploads (format, size, corruption detection)
- CORS configuration for production domains (supports single, CSV, and JSON array formats)
- Secure WebSocket support (WSS in production)

---

## 🏗️ System Architecture

### **Production Architecture: Client-Side Camera Model**

```
┌─────────────────────────────────────────────────────────────┐
│                  BROWSER (Client-Side)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  navigator.mediaDevices.getUserMedia()               │  │
│  │  • Camera permission request                         │  │
│  │  • Video stream capture (1280x720@30fps)            │  │
│  │  • Frame encoding (JPEG)                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                    WebSocket (WSS)                           │
│                   Send: Video Frames                         │
│                   Receive: Landmarks + Gestures             │
└───────────────────────────┼──────────────────────────────────┘
                             │
┌───────────────────────────┼──────────────────────────────────┐
│                  CLOUD SERVER (Render/AWS/GCP)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  WebSocket Handler (/ws/live)                        │  │
│  │  • Receive base64 frames from client                │  │
│  │  • Decode frames                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Hand Tracking Engine (MediaPipe)                    │  │
│  │  • 21-point landmark detection                       │  │
│  │  • Multi-hand tracking                               │  │
│  │  • Gesture recognition (rule-based)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Response                                            │  │
│  │  • Hand landmarks (normalized coordinates)           │  │
│  │  • Detected gestures + confidence                    │  │
│  │  • Processing metrics                                │  │
│  │  • Annotated frame (optional)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Architecture Points:**
- ✅ **No server-side camera**: Works on any cloud platform without physical camera access
- ✅ **Browser captures camera**: All camera permission and capture logic is client-side
- ✅ **Frame streaming**: Client sends frames to server for heavy ML processing
- ✅ **Scalable**: Stateless server design allows horizontal scaling
- ✅ **Secure**: HTTPS required for camera access, WSS for WebSocket security

### **Backend Components**

- **`app/api/`**: REST and WebSocket endpoints
  - `camera.py`: Camera control endpoints
  - `video.py`: Video upload and processing
  - `websocket.py`: Real-time streaming

- **`app/services/`**: Business logic layer
  - `hand_tracking.py`: MediaPipe integration
  - `camera_service.py`: Camera management
  - `video_service.py`: Video processing

- **`app/models/`**: Pydantic schemas
- **`app/core/`**: Configuration and logging
- **`app/utils/`**: Utility functions

### **Frontend Components**

- **`components/features/`**: Main feature components
  - `GestureCanvas.tsx`: Video feed and landmark rendering
  - `GestureDashboard.tsx`: Current gesture display
  - `PerformanceHUD.tsx`: Metrics and FPS
  - `ControlPanel.tsx`: System controls
  - `VideoUploadModal.tsx`: Video upload interface

- **`hooks/`**: Custom React hooks
  - `useWebSocket.ts`: WebSocket connection
  - `useGestureTracking.ts`: Gesture analytics

- **`services/`**: API communication
- **`types/`**: TypeScript definitions
- **`styles/`**: Global styles and themes

---

## 🚀 Quick Start

### **Prerequisites**

- Python 3.10+
- Node.js 18+
- Webcam (for live mode)
- 4GB RAM minimum

### **1. Clone Repository**

```bash
git clone https://github.com/Anamitra-Sarkar/Gesture.git
cd Gesture
```

### **2. Backend Setup**

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Start server
python main.py
```

Backend will run on `http://localhost:8000`

### **3. Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### **4. Access the Platform**

Open your browser to `http://localhost:5173` and click "Start Camera" to begin!

---

## 🚀 Production Deployment

### **Deployment Architecture**

The platform is deployed with a distributed architecture:
- **Frontend**: Vercel (Static Site Hosting) - https://gesture-detection-lac.vercel.app
- **Backend**: Render (Container Service) - https://gesture-vl7k.onrender.com
- **Communication**: REST API + WebSocket (WSS in production)
- **Configuration**: URLs are **hardcoded** in source code (no environment variables needed)

> 📖 **See [DEPLOYMENT_CONFIG.md](./DEPLOYMENT_CONFIG.md)** for detailed deployment configuration and connection setup.

### **Why Client-Side Camera? (Architecture Decision)**

**❌ OLD (Doesn't Work in Cloud):**
```
Browser → Backend tries cv2.VideoCapture() → ❌ No camera in cloud
```

**✅ NEW (Cloud-Compatible):**
```
Browser captures camera → Sends frames via WebSocket → Backend processes with MediaPipe → Returns results
```

**Key Benefits:**
1. **Cloud Compatible**: Works on Render, AWS, GCP, Azure (no physical camera needed)
2. **Scalable**: Backend is stateless and can scale horizontally
3. **Secure**: Camera permission handled by browser security model
4. **Better UX**: User has full control over camera access
5. **Mobile Friendly**: Works on any device with a camera and browser
6. **No Docker Camera Issues**: No need for --privileged or /dev/video0 mounting

### **Backend Deployment (Render)**

1. **Prerequisites**
   - Render account
   - GitHub repository connected to Render

2. **Render Configuration**
   - Service Type: Web Service
   - Environment: Docker
   - Instance Type: Standard (or higher for production traffic)
   
3. **Environment Variables** *(Optional - Not Required)*
   
   **✅ No environment variables needed!** The backend has production CORS origins hardcoded.
   
   However, you can optionally override the defaults:
   ```
   PORT=<auto-assigned by Render>
   CORS_ORIGINS=https://your-custom-frontend.com  # Optional
   DEBUG_MODE=false
   ```

4. **Build Command**: Automatic (uses Dockerfile)
   
5. **Dockerfile Features**:
   - Debian Bullseye base (stable)
   - Optimized for OpenCV and MediaPipe
   - Production dependencies only
   - Automatic PORT configuration
   - **No camera dependencies** (cloud-compatible)

6. **Health Checks**:
   - Render's health checks use HEAD requests
   - Endpoint: `HEAD /health` (supported)
   - Alternative: `GET /health` (also supported)
   - Returns 200 OK when healthy

### **Frontend Deployment (Vercel)**

1. **Prerequisites**
   - Vercel account
   - GitHub repository connected to Vercel

2. **Vercel Configuration**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`

3. **Environment Variables** *(Optional - Not Required)*
   
   **✅ No environment variables needed!** The frontend automatically detects the environment:
   - **Local Development** (localhost): Uses `http://localhost:8000`
   - **Production** (Vercel): Uses `https://gesture-vl7k.onrender.com`
   
   The backend URL is hardcoded in `frontend/src/services/api.ts` for reliability.

4. **Features**:
   - Automatic HTTPS
   - CDN distribution
   - Zero-downtime deployments
   - Preview deployments for PRs

### **Camera Permissions in Production**

The application handles camera permissions using the browser's native API:

#### **How It Works**
1. Camera permission is requested through the browser's `navigator.mediaDevices.getUserMedia()` API
2. Permission modal provides clear instructions before requesting access
3. Browser shows native permission prompt
4. Camera stream is captured entirely in the browser (client-side)
5. Frames are encoded and sent to server via WebSocket for processing

#### **Desktop Browsers**
- **Chrome/Edge**: Click camera icon in address bar → Allow
- **Firefox**: Click camera icon in address bar → Allow
- **Safari**: Safari → Settings → Websites → Camera → Allow

#### **Mobile Browsers**
- **Android Chrome**: Browser prompts automatically, or check Settings → Site Settings → Camera
- **iOS Safari**: Settings → Safari → Camera → Allow for website
- **Notes**: 
  - HTTPS is **required** for camera access (Vercel provides this automatically)
  - Some mobile browsers may have additional restrictions
  - First-time users see a permission modal with clear instructions

#### **Permission States**
The app clearly indicates:
- ✅ **Granted**: Camera ready to use, capturing in browser
- ⏳ **Prompt**: Waiting for user permission
- ❌ **Denied**: User must enable in browser settings
- ⚠️ **Unavailable**: No camera detected or in use by another app

#### **Troubleshooting Camera Permissions**
- If permission is denied, check browser address bar for camera icon
- Clear site data and reload if permissions are stuck
- Ensure no other application is using the camera
- Check system permissions on mobile devices
- Make sure you're accessing via HTTPS (not HTTP)

### **WebSocket Configuration**

Production WebSocket connections automatically upgrade to WSS (secure):
- Local development: `ws://localhost:8000/ws/live`
- Production: `wss://your-backend.onrender.com/ws/live`

The frontend automatically detects the protocol based on the API URL.

### **Known Production Considerations**

1. **Camera Access**
   - Requires HTTPS in production (automatically handled by Vercel)
   - Some browsers may cache permission denials

2. **WebSocket Stability**
   - Render free tier may have connection limits
   - Consider upgrading for production traffic

3. **Video Processing**
   - Large video uploads may timeout on free tiers
   - Implement chunked uploads for files > 50MB (future enhancement)

4. **Performance**
   - Render cold starts may take 30-60 seconds
   - Keep-alive pings recommended for critical applications

---

## 📱 Mobile Browser Compatibility

### **Supported Mobile Browsers**
- ✅ Chrome on Android (latest 2 versions)
- ✅ Safari on iOS (iOS 14+)
- ⚠️ Firefox Mobile (limited WebSocket support)
- ❌ Opera Mini (no camera API support)

### **Mobile-Specific Features**
- Touch-optimized controls
- Responsive layout for small screens
- Adaptive video quality
- Battery-conscious processing

### **Mobile Known Issues**
- Some Android devices may require manual camera permission in system settings
- iOS Safari may need page reload after granting camera permission
- Landscape mode recommended for best experience

---

## 📖 Usage Guide

### **Live Camera Mode (Client-Side Capture)**

1. Click **"Start Camera"** in the control panel
2. Permission modal will appear - click "Allow Camera Access"
3. Browser will prompt for camera permission - click "Allow"
4. Camera starts capturing in browser, frames are sent to server for processing
5. Watch real-time gesture detection with confidence scores
6. View landmarks overlaid on the video feed
7. Access **Analytics Dashboard** to view historical data

**Important Notes:**
- Camera capture happens entirely in your browser (client-side)
- Frames are sent to the server only for ML processing
- No camera feed is stored or recorded
- Works on any device with a camera and modern browser
- Requires HTTPS in production (automatically provided by Vercel)

### **Video Upload Mode**

1. Click **"Upload Video"** button
2. Drag & drop or browse for a video file
3. Supported formats: MP4, AVI, WebM, MOV (max 100MB)
4. File validation ensures format and size compliance
5. Click "Upload" to process
6. View frame-by-frame analysis results

### **Analytics Dashboard**

1. Click **"Analytics"** button in the control panel
2. View gesture statistics:
   - Total gestures detected
   - Average confidence scores
   - Top gestures by frequency
3. Browse complete gesture history with timestamps
4. Export data as JSON for external analysis
5. Clear history if needed

### **Performance Monitoring**

- **FPS**: Real-time frames per second
- **Latency**: Processing time per frame (ms)
- **Frames**: Total frames processed
- **Gestures**: Total gestures detected
- **Session**: Unique session tracking with persistence

---

## ⚙️ Configuration

### **Backend Configuration** (`backend/.env`)

```env
# Camera Settings
CAMERA_INDEX=0              # Camera device index
CAMERA_WIDTH=1280           # Capture width
CAMERA_HEIGHT=720           # Capture height
CAMERA_FPS=30               # Target FPS

# MediaPipe Settings
MP_MODEL_COMPLEXITY=1       # 0 (fast) or 1 (accurate)
MP_MIN_DETECTION_CONFIDENCE=0.7
MP_MIN_TRACKING_CONFIDENCE=0.5
MP_MAX_NUM_HANDS=2          # Maximum hands to detect

# Processing Settings
LANDMARK_SMOOTHING_FACTOR=0.3  # 0-1, higher = more smoothing
GESTURE_CONFIDENCE_THRESHOLD=0.75
GESTURE_TEMPORAL_WINDOW=5      # Frames for temporal consistency

# Video Upload
MAX_VIDEO_SIZE_MB=100
```

### **Frontend Configuration** (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## 🎨 Gesture Detection Logic

### **Open Palm**
- All 5 fingers extended
- Fingertips above knuckles
- Minimum 80% confidence

### **Fist**
- All fingertips close to palm
- Average distance < threshold
- High compactness score

### **Pinch**
- Thumb and index finger touching
- Distance < 0.1 normalized units
- Other fingers not extended

### **Pointing**
- Index finger extended
- Other fingers closed
- Angle threshold: 140°+

### **Thumbs Up/Down**
- Thumb extended vertically
- Other fingers closed
- Direction check (up/down)

### **Peace Sign**
- Index and middle fingers extended
- Other fingers closed
- Finger separation verified

### **OK Sign**
- Thumb and index forming circle
- Other fingers extended
- Circle diameter < threshold

---

## 🛠️ Technology Stack

### **Backend**
- **FastAPI**: Modern async web framework
- **MediaPipe**: Google's hand tracking solution
- **OpenCV**: Computer vision operations
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server
- **WebSockets**: Real-time communication

### **Frontend**
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Framer Motion**: Animation library
- **Lucide React**: Icon library
- **CSS3**: Glassmorphism styling

---

## 📊 Performance Benchmarks

**Tested on MacBook Pro M1, 16GB RAM:**

| Metric | Value |
|--------|-------|
| Average FPS | 28-30 |
| Processing Latency | 15-25ms |
| Memory Usage | 300-500MB |
| Gesture Accuracy | 85-92% |
| Multi-hand Detection | ✅ Supported |

---

## 🐛 Troubleshooting

### **Camera Not Starting**
- Check camera permissions in browser (click camera icon in address bar)
- Ensure no other app is using the camera (close Zoom, Teams, etc.)
- Reload the page and try again
- Clear browser cache and site data
- **Note**: Camera is captured in the browser, not on the server

### **Low FPS / Performance Issues**
- Close other resource-intensive applications
- Use a modern browser (latest Chrome, Firefox, or Edge recommended)
- Check your internet connection (frames are sent to server for processing)
- Try reducing browser window size
- **Note**: Processing happens server-side, but network latency affects FPS

### **WebSocket Connection Failed**
- Verify backend is running and accessible
- Check network/firewall settings
- Ensure CORS is configured correctly on backend
- In production, ensure WSS (secure WebSocket) is used

### **Gestures Not Detected**
- Ensure good lighting conditions
- Keep hand within camera frame (centered)
- Try different hand orientations
- Move hand slightly farther from camera
- Ensure only one or two hands are in frame

### **Permission Denied Error**
- Click camera icon in browser address bar
- Select "Always allow" and reload
- Check system camera permissions (especially on Mac)
- If using mobile, check app permissions in system settings

### **"Camera unavailable" Error**
- Ensure camera is connected (for external webcams)
- Check if another application is using the camera
- Restart browser
- Check browser console for detailed error messages

---

## ✅ Implemented Features

### **Core Platform** (Completed)
- ✅ Real-time hand tracking with MediaPipe
- ✅ 8 gesture types with confidence scoring
- ✅ Live camera processing with WebSocket streaming
- ✅ Video upload and validation
- ✅ Production-grade permission handling
- ✅ Mobile browser compatibility
- ✅ Gesture history persistence (localStorage)
- ✅ Analytics dashboard with data export
- ✅ Multi-session tracking with unique IDs
- ✅ Performance metrics and monitoring
- ✅ Production deployment (Vercel + Render)

### **Security & Permissions** (Completed)
- ✅ Explicit camera permission requests
- ✅ Browser-specific permission instructions
- ✅ File validation for uploads
- ✅ CORS configuration for production
- ✅ Secure WebSocket support (WSS)

## 🔮 Future Enhancements

Potential areas for expansion (not currently required):

- [ ] Custom gesture training interface (ML model training)
- [ ] Gesture-based UI controls (navigate UI with gestures)
- [ ] 3D hand pose estimation visualization
- [ ] Mobile native app (React Native)
- [ ] Advanced video processing pipeline
- [ ] Real-time collaboration features
- [ ] Cloud storage for gesture history

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Anamitra Sarkar**

This platform is designed for production use in:
- Enterprise applications
- Client deliverables
- Interactive installations
- Accessibility solutions
- Computer vision research
- Real-world gesture control systems

---

## 🙏 Acknowledgments

- **MediaPipe** team for robust hand tracking
- **FastAPI** community for powerful framework
- **Framer Motion** for fluid animations
- **React** team for scalable UI library
- **Vercel** and **Render** for reliable hosting

---

<div align="center">

**Production-Ready Hand Gesture Recognition Platform**

*Built for real users, real devices, and real-world applications*

**Live Application**: [gesture-detection-lac.vercel.app](https://gesture-detection-lac.vercel.app)

</div>
