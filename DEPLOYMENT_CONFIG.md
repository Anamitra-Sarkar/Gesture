# 🚀 Deployment Configuration Guide

## Overview

This document explains how the frontend and backend are connected in production without using environment variables. The URLs are **hardcoded** in the source code for simplicity and reliability.

## Production URLs

- **Frontend**: https://gesture-detection-lac.vercel.app
- **Backend**: https://gesture-vl7k.onrender.com

## How It Works

### Frontend Configuration

The frontend automatically detects the environment and uses the appropriate backend URL:

**File**: `frontend/src/services/api.ts`

```typescript
const getApiBaseUrl = () => {
  // Check if running in development environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Use localhost for local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }
  // Use production backend URL for all deployed environments
  return 'https://gesture-vl7k.onrender.com';
};
```

**Behavior**:
- 🏠 **Local Development** (localhost or 127.0.0.1): Uses `http://localhost:8000`
- 🌐 **Production** (any other domain): Uses `https://gesture-vl7k.onrender.com`

### WebSocket Connection

The WebSocket URL is automatically derived from the HTTP URL:
- Local: `ws://localhost:8000/ws/live`
- Production: `wss://gesture-vl7k.onrender.com/ws/live` (secure WebSocket)

**Conversion Logic**:
```typescript
const wsUrl = baseUrl.replace(/^http(s)?:/, 'ws$1:') + '/ws/live';
```

This ensures:
- `http://` → `ws://`
- `https://` → `wss://` (secure)

### Backend Configuration

The backend includes production frontend URLs in CORS origins by default:

**File**: `backend/app/core/config.py`

```python
_default_cors_origins: List[str] = [
    "http://localhost:3000", 
    "http://localhost:5173", 
    "http://127.0.0.1:3000", 
    "http://127.0.0.1:5173",
    "https://gesture-detection-lac.vercel.app",  # Production frontend
]
```

**Normalization**:
The backend automatically includes both versions of each URL:
- `https://gesture-detection-lac.vercel.app`
- `https://gesture-detection-lac.vercel.app/` (with trailing slash)

This ensures compatibility with all frontend requests, regardless of how they format the origin.

## No Environment Variables Required

✅ **Frontend**: No `.env` file needed - URL detection is automatic  
✅ **Backend**: No `CORS_ORIGINS` environment variable needed - defaults include production URL

**However**, if you need to customize the CORS origins, you can still set the `CORS_ORIGINS` environment variable on Render, which will override the defaults.

## Deployment Steps

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set these build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
   - **Root Directory**: `frontend`
3. Deploy - no environment variables needed!

### Render (Backend)

1. Connect your GitHub repository to Render
2. Set these settings:
   - **Environment**: Docker
   - **Root Directory**: `backend`
3. The Dockerfile will handle the rest
4. No environment variables needed - CORS is pre-configured!

## Testing the Connection

### Local Testing

1. Start backend:
   ```bash
   cd backend
   python main.py
   ```
   Backend runs on `http://localhost:8000`

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

3. Open `http://localhost:5173` in your browser
4. The frontend will automatically connect to `http://localhost:8000`

### Production Testing

1. Visit https://gesture-detection-lac.vercel.app
2. The frontend will automatically connect to https://gesture-vl7k.onrender.com
3. Click "Start Camera" to test the connection
4. Check browser console for connection logs:
   ```
   [ApiService] Initialized with base URL: https://gesture-vl7k.onrender.com
   [ApiService] Creating WebSocket connection to: wss://gesture-vl7k.onrender.com/ws/live
   ```

## Troubleshooting

### Connection Issues

**Issue**: Frontend can't connect to backend  
**Check**:
1. Verify backend is running: Visit https://gesture-vl7k.onrender.com/health
2. Check browser console for errors
3. Verify CORS headers in Network tab

**Issue**: WebSocket connection fails  
**Check**:
1. Ensure backend supports WSS (WebSocket Secure) for HTTPS
2. Check for firewall/proxy blocking WebSocket connections
3. Verify WebSocket URL in browser console

### CORS Errors

**Issue**: CORS policy blocks requests  
**Solution**: The production URL is already hardcoded. If you changed the frontend URL:
1. Update `backend/app/core/config.py`
2. Add your new URL to `_default_cors_origins`
3. Redeploy backend

### URL Changes

**If you change the backend URL**:
1. Update `frontend/src/services/api.ts`
2. Change the return value in `getApiBaseUrl()` function
3. Redeploy frontend

**If you change the frontend URL**:
1. Update `backend/app/core/config.py`
2. Add the new URL to `_default_cors_origins`
3. Redeploy backend

## Benefits of Hardcoded URLs

✅ **No environment variable configuration needed**  
✅ **Automatic environment detection**  
✅ **Works out of the box**  
✅ **Simpler deployment process**  
✅ **Less prone to configuration errors**  
✅ **Clear and explicit configuration in code**

## Security Considerations

- URLs are public-facing endpoints anyway, so hardcoding them is safe
- CORS protection is enforced by the backend
- HTTPS/WSS ensures encrypted communication in production
- Browser security model protects camera access

---

**Last Updated**: January 7, 2026  
**Status**: ✅ Production Ready
