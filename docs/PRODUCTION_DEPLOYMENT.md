# Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Hand Gesture Recognition Platform to production using Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account with repository access
- Vercel account
- Render account
- Domain understanding of environment variables
- Basic knowledge of Docker (for backend)

---

## Backend Deployment (Render)

### Step 1: Create Render Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your repository (e.g., `username/your-repo-name`)

### Step 2: Configure Service

**Basic Settings:**
- **Name**: `gesture-recognition-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your production branch)
- **Root Directory**: `backend`
- **Environment**: `Docker`
- **Docker Command**: Leave empty (uses Dockerfile CMD)

**Instance Type:**
- Development: Free or Starter
- Production: Standard or higher (recommended for consistent performance)

### Step 3: Environment Variables

Add the following environment variables in Render dashboard:

```bash
# CORS Configuration (REQUIRED)
CORS_ORIGINS=https://gesture-detection-lac.vercel.app,https://your-custom-domain.com

# Application Settings
DEBUG_MODE=false
APP_NAME=Hand Gesture Recognition Platform
APP_VERSION=1.0.0

# Camera Settings (optional - defaults work)
CAMERA_INDEX=0
CAMERA_WIDTH=1280
CAMERA_HEIGHT=720
CAMERA_FPS=30

# MediaPipe Settings (optional - defaults work)
MP_MODEL_COMPLEXITY=1
MP_MIN_DETECTION_CONFIDENCE=0.7
MP_MIN_TRACKING_CONFIDENCE=0.5
MP_MAX_NUM_HANDS=2

# Processing Settings (optional)
LANDMARK_SMOOTHING_FACTOR=0.3
GESTURE_CONFIDENCE_THRESHOLD=0.75
GESTURE_TEMPORAL_WINDOW=5

# Video Upload Settings (optional)
MAX_VIDEO_SIZE_MB=100
UPLOAD_DIR=uploads
```

**Important Notes:**
- `PORT` is automatically set by Render - DO NOT set manually
- `CORS_ORIGINS` must include your Vercel domain
- Use comma-separated list for multiple origins

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. First build takes 5-10 minutes
4. Monitor build logs for any errors

### Step 5: Verify Backend

Once deployed, test these endpoints:

```bash
# Health check
curl https://your-backend.onrender.com/health

# API root
curl https://your-backend.onrender.com/

# WebSocket test (use a WebSocket client)
wss://your-backend.onrender.com/ws/live
```

Expected responses:
- `/health`: `{"status":"healthy","service":"Hand Gesture Recognition Platform"}`
- `/`: JSON with API information and endpoints

### Troubleshooting Backend

**Build Failures:**
- Check Render build logs
- Verify Dockerfile syntax
- Ensure all dependencies in requirements.txt

**Runtime Failures:**
- Check application logs in Render dashboard
- Verify environment variables
- Check PORT configuration (should be auto)

**Cold Starts:**
- Free tier sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake
- Upgrade to paid tier for always-on service

---

## Frontend Deployment (Vercel)

### Step 1: Connect Repository

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository (e.g., `username/your-repo-name`)

### Step 2: Configure Project

**Framework Preset:**
- Select: **Vite**

**Build & Development Settings:**
- Build Command: `npm run build`
- Output Directory: `frontend/dist`
- Install Command: `npm install`
- Root Directory: `frontend`

### Step 3: Environment Variables

Add in Vercel project settings:

```bash
# Backend API URL (REQUIRED)
VITE_API_URL=https://your-backend.onrender.com

# Optional: Analytics or other services
# VITE_ANALYTICS_ID=your-analytics-id
```

**Important:**
- Replace `your-backend.onrender.com` with your actual Render URL
- Use HTTPS (not HTTP) for production
- All variables must start with `VITE_` to be exposed to frontend

### Step 4: Deploy

1. Click "Deploy"
2. Vercel builds and deploys automatically
3. Build takes 1-2 minutes
4. Vercel provides a URL: `your-project.vercel.app`

### Step 5: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `CORS_ORIGINS` in backend to include new domain

### Step 6: Verify Frontend

Visit your Vercel URL and test:

1. ✅ Page loads without errors
2. ✅ "Start Camera" button visible
3. ✅ Camera permission modal appears
4. ✅ Analytics dashboard accessible
5. ✅ No console errors

### Troubleshooting Frontend

**Build Failures:**
- Check Vercel build logs
- Run `npm run build` locally first
- Verify TypeScript compilation

**Runtime Errors:**
- Open browser console (F12)
- Check network requests
- Verify `VITE_API_URL` is correct

**Camera Permission Issues:**
- HTTPS required (Vercel provides automatically)
- Test on different browsers
- Check browser console for specific errors

**WebSocket Connection Fails:**
- Verify backend is running
- Check CORS configuration
- Ensure backend URL uses HTTPS (not HTTP)

---

## Post-Deployment Configuration

### Update Backend CORS

After frontend is deployed, update backend CORS:

1. Go to Render dashboard
2. Navigate to your backend service
3. Update `CORS_ORIGINS` environment variable:
   ```
   CORS_ORIGINS=https://your-frontend.vercel.app,https://custom-domain.com
   ```
4. Save and redeploy

### Enable WebSocket over WSS

WebSocket connections automatically upgrade to WSS when:
- Backend uses HTTPS (Render provides this)
- Frontend uses HTTPS (Vercel provides this)
- No manual configuration needed

### Test End-to-End

1. Visit frontend URL
2. Click "Start Camera"
3. Grant camera permission
4. Verify hand tracking works
5. Test gesture recognition
6. Check analytics dashboard
7. Try video upload

---

## Performance Optimization

### Backend (Render)

**For Production:**
- Use Standard instance or higher
- Enable persistent storage for uploads
- Configure health check endpoint: `/health`
- Set up custom domain for better branding

**Scaling:**
- Horizontal scaling available on paid tiers
- Consider load balancer for high traffic
- Monitor resource usage in Render dashboard

### Frontend (Vercel)

**Already Optimized:**
- ✅ CDN distribution worldwide
- ✅ Automatic HTTPS
- ✅ Gzip compression
- ✅ Asset caching

**Additional:**
- Enable Vercel Analytics for monitoring
- Configure edge functions if needed (future)
- Set up custom error pages

---

## Monitoring & Maintenance

### Logs

**Backend (Render):**
- Access logs in Render dashboard
- Set up log alerts for errors
- Monitor API response times

**Frontend (Vercel):**
- Access build logs in Vercel dashboard
- View deployment history
- Monitor function execution (if applicable)

### Health Checks

**Backend:**
```bash
# Automated health check
curl https://your-backend.onrender.com/health

# Expected: {"status":"healthy",...}
```

**Frontend:**
```bash
# Manual check
open https://your-frontend.vercel.app

# Automated: Use Pingdom, UptimeRobot, etc.
```

### Uptime Monitoring

Recommended services:
- **UptimeRobot**: Free tier available
- **Pingdom**: Comprehensive monitoring
- **Better Uptime**: Modern interface

Monitor these endpoints:
- Frontend: `https://your-frontend.vercel.app`
- Backend: `https://your-backend.onrender.com/health`

---

## Security Considerations

### HTTPS

✅ **Automatic:** Both Vercel and Render provide HTTPS automatically
- No manual SSL certificate needed
- Automatic renewal

### CORS

✅ **Configured:** Backend restricts origins
- Only whitelisted domains can access API
- Update `CORS_ORIGINS` when adding new domains

### Camera Permissions

✅ **Implemented:** User must explicitly grant permission
- No auto-start
- Clear permission states
- Browser-specific instructions

### Environment Variables

⚠️ **Important:**
- Never commit `.env` files
- Use platform dashboards to set variables
- Frontend variables are public (prefixed with `VITE_`)
- Backend variables are private

---

## Cost Estimation

### Free Tier (Development/Testing)

**Render Free:**
- ✅ Backend hosting
- ⚠️ Sleeps after 15 minutes inactivity
- ⚠️ 750 hours/month limit
- ⚠️ Cold start delays

**Vercel Free:**
- ✅ Frontend hosting
- ✅ Unlimited bandwidth
- ✅ Automatic deployments
- ✅ 100 GB-hours

**Total: $0/month**

### Production (Recommended)

**Render Starter:** $7/month
- ✅ Always-on
- ✅ 512 MB RAM
- ✅ No cold starts
- ✅ Custom domain

**Vercel Pro:** $20/month
- ✅ Advanced analytics
- ✅ Better performance
- ✅ Team collaboration
- ✅ Support

**Total: ~$27/month**

### Enterprise

Contact Render and Vercel for custom pricing based on:
- Traffic volume
- Resource requirements
- SLA requirements
- Support needs

---

## Rollback & Recovery

### Vercel Rollback

1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"
4. Instant rollback (no build required)

### Render Rollback

1. Go to service dashboard
2. Click "Manual Deploy" tab
3. Select previous commit SHA
4. Click "Deploy"
5. Wait 5-10 minutes for rebuild

### Backup Strategy

**Code:**
- ✅ Git version control
- ✅ GitHub repository backups

**Data:**
- User gesture history: Stored locally (browser localStorage)
- No database to backup
- Users can export their data as JSON

---

## Support & Resources

### Documentation

- Platform README: `/README.md`
- Architecture docs: `/docs/ARCHITECTURE.md`
- Development guide: `/docs/DEVELOPMENT.md`

### Platform Documentation

- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **React**: https://react.dev

### Community

- GitHub Issues: For bug reports
- Discussions: For feature requests
- Pull Requests: For contributions

---

## Checklist

### Pre-Deployment

- [ ] Code committed to GitHub
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend Docker builds successfully
- [ ] Environment variables documented
- [ ] CORS origins identified

### Backend Deployment

- [ ] Render service created
- [ ] Docker build successful
- [ ] Environment variables set
- [ ] Health check passing
- [ ] WebSocket accessible

### Frontend Deployment

- [ ] Vercel project created
- [ ] Build successful
- [ ] Environment variables set
- [ ] CORS updated in backend
- [ ] Camera permissions working

### Post-Deployment

- [ ] End-to-end testing complete
- [ ] Analytics working
- [ ] Performance acceptable
- [ ] Monitoring configured
- [ ] Documentation updated

---

## Success Criteria

Your deployment is successful when:

✅ Frontend loads without errors  
✅ Camera permission flow works  
✅ Hand tracking processes in real-time  
✅ Gestures detected accurately  
✅ Analytics dashboard functional  
✅ Video upload works  
✅ No console errors  
✅ WebSocket connection stable  
✅ Mobile browsers supported  

---

**Deployed By:** GitHub Copilot  
**Last Updated:** January 2026  
**Status:** Production Ready ✅
