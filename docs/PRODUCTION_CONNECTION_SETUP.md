# Frontend-Backend Connection Configuration

## Overview
This document explains the configuration required for the frontend and backend to communicate properly in production.

## Architecture

- **Frontend**: React/TypeScript app deployed on Vercel
- **Backend**: FastAPI Python app deployed on Render
- **Communication**: REST API + WebSocket for real-time gesture tracking

## Environment Variables

### Backend (Render)

Set these environment variables in Render dashboard:

```bash
APP_NAME=Hand Gesture Recognition Platform
APP_VERSION=1.0.0
DEBUG_MODE=false

# CORS Origins - IMPORTANT: No trailing slashes needed!
# The backend automatically handles both with and without trailing slashes
CORS_ORIGINS=https://gesture-detection-lac.vercel.app

# Video upload settings
UPLOAD_DIR=uploads
MAX_VIDEO_SIZE_MB=100
```

**Important Notes:**
- The `CORS_ORIGINS` value should **NOT** include a trailing slash
- The backend automatically creates both versions (with and without slash) for compatibility
- You can specify multiple origins separated by commas: `CORS_ORIGINS=https://domain1.com,https://domain2.com`

### Frontend (Vercel)

Set these environment variables in Vercel dashboard:

```bash
VITE_API_URL=https://gesture-vl7k.onrender.com
```

**Important Notes:**
- The `VITE_API_URL` should **NOT** include a trailing slash
- This URL is your Render backend URL
- Must start with `https://` for production

## How It Works

### 1. CORS Handling
The backend's CORS configuration automatically normalizes origins:
- Input: `https://example.com/` → Creates: `https://example.com` AND `https://example.com/`
- Input: `https://example.com` → Creates: `https://example.com` AND `https://example.com/`

This ensures that requests from browsers (which may or may not include trailing slashes) are always accepted.

### 2. API Communication
```typescript
// Frontend (api.ts)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

The frontend reads the API URL from the environment variable and uses it for all HTTP requests.

### 3. WebSocket Communication
```typescript
// Frontend (api.ts)
const wsUrl = this.baseUrl.replace(/^http(s)?:/, 'ws$1:') + '/ws/live';
// http://localhost:8000 → ws://localhost:8000/ws/live
// https://gesture-vl7k.onrender.com → wss://gesture-vl7k.onrender.com/ws/live
```

The frontend automatically converts HTTP/HTTPS to WS/WSS for WebSocket connections.

## Deployment Checklist

### Backend (Render)
- [ ] Set `CORS_ORIGINS` to your Vercel frontend URL (without trailing slash)
- [ ] Verify the app starts successfully
- [ ] Check logs to see CORS origins are loaded correctly
- [ ] Test the `/health` endpoint

### Frontend (Vercel)
- [ ] Set `VITE_API_URL` to your Render backend URL (without trailing slash)
- [ ] Build succeeds
- [ ] Verify the environment variable is available at runtime

### Testing the Connection
1. Open browser DevTools (F12)
2. Go to Network tab
3. Load your frontend
4. Check for:
   - API requests to the backend (should not show CORS errors)
   - WebSocket connection to `/ws/live` (should connect successfully)

## Common Issues

### CORS Errors
**Symptom**: Browser console shows "CORS policy" errors

**Solution**:
1. Check that `CORS_ORIGINS` includes your frontend domain
2. Remove any trailing slashes from the URL
3. Verify the backend logs show the correct origins
4. Redeploy the backend after changing environment variables

### WebSocket Connection Fails
**Symptom**: WebSocket shows "failed to connect" or "connection refused"

**Solution**:
1. Verify `VITE_API_URL` is set correctly on Vercel
2. Check that the backend is running on Render
3. Look at browser DevTools Network tab → WS filter
4. Verify the WebSocket URL is using `wss://` (not `ws://`) for HTTPS backends

### Environment Variables Not Applied
**Symptom**: App uses localhost URL instead of production URL

**Solution for Vercel**:
1. Environment variables must be set BEFORE building
2. Go to Vercel dashboard → Settings → Environment Variables
3. Add `VITE_API_URL` and save
4. Trigger a new deployment (not just redeploy)

**Solution for Render**:
1. Go to Render dashboard → Environment
2. Add/update `CORS_ORIGINS`
3. Save changes (automatic redeploy triggered)

## Verification Steps

Run these checks to verify everything is configured correctly:

### 1. Backend Health Check
```bash
curl https://gesture-vl7k.onrender.com/health
# Expected: {"status":"healthy","service":"Hand Gesture Recognition Platform"}
```

### 2. Backend Root Endpoint
```bash
curl https://gesture-vl7k.onrender.com/
# Expected: JSON with app info and endpoints
```

### 3. Frontend Can Reach Backend
Open browser console on your frontend and check:
```javascript
console.log(import.meta.env.VITE_API_URL);
// Should show: https://gesture-vl7k.onrender.com
```

### 4. CORS Headers Present
```bash
curl -H "Origin: https://gesture-detection-lac.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://gesture-vl7k.onrender.com/health -v
# Look for: Access-Control-Allow-Origin header in response
```

## Production URLs

- **Frontend**: https://gesture-detection-lac.vercel.app
- **Backend**: https://gesture-vl7k.onrender.com
- **WebSocket**: wss://gesture-vl7k.onrender.com/ws/live

## Default Fallbacks

If environment variables are not set, the app falls back to:

- **Frontend**: `http://localhost:8000` (for local development)
- **Backend CORS**: Allows localhost origins + production frontend

## Summary

The key to making the connection work is:
1. ✅ **No trailing slashes** in environment variables
2. ✅ Backend normalizes CORS origins automatically
3. ✅ Frontend uses environment variable for API URL
4. ✅ WebSocket URL is constructed from API URL with proper protocol conversion

With these settings, the frontend and backend will communicate successfully without any manual intervention.
