# 🚀 Quick Start Guide - Post-Update Deployment

## What Changed?

The backend and frontend now connect automatically without environment variables!

## Deployment URLs

- **Frontend**: https://gesture-detection-lac.vercel.app
- **Backend**: https://gesture-vl7k.onrender.com

## How to Deploy

### Option 1: Automatic Redeployment (Recommended)

Both Vercel and Render should automatically redeploy when you merge this PR:

1. **Merge this PR** to your main branch
2. **Wait for automatic deployments**:
   - Vercel will auto-deploy frontend
   - Render will auto-deploy backend
3. **Done!** No configuration needed

### Option 2: Manual Trigger

If auto-deployment is not enabled:

#### Vercel (Frontend)
1. Go to Vercel dashboard
2. Click "Redeploy" on your project
3. Wait for build to complete
4. ✅ Done!

#### Render (Backend)
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete
4. ✅ Done!

## Testing the Connection

### 1. Check Backend is Running

Visit: https://gesture-vl7k.onrender.com/health

Should return:
```json
{
  "status": "healthy",
  "service": "Hand Gesture Recognition Platform"
}
```

### 2. Test Frontend Connection

1. Visit: https://gesture-detection-lac.vercel.app
2. Open browser DevTools (F12) → Console tab
3. Look for this log message:
   ```
   [ApiService] Initialized with base URL: https://gesture-vl7k.onrender.com
   ```

### 3. Test Full Functionality

1. Click **"Start Camera"** button
2. Allow camera permissions when prompted
3. Check console for:
   ```
   [ApiService] Creating WebSocket connection to: wss://gesture-vl7k.onrender.com/ws/live
   WebSocket transport connected - waiting for READY signal
   Backend READY signal received
   ```
4. Wave your hand - gestures should be detected!

## Troubleshooting

### Issue: "Failed to connect to backend"

**Check**:
1. Is backend running? → Visit https://gesture-vl7k.onrender.com/health
2. Check browser console for errors
3. Verify CORS in Network tab (should see `access-control-allow-origin` header)

**Solution**: Backend is already configured correctly. If this persists, check if Render deployment completed successfully.

### Issue: WebSocket connection fails

**Check**:
1. Backend health endpoint works?
2. Browser console shows correct WebSocket URL (wss://)?
3. Any firewall/proxy blocking WebSocket?

**Solution**: The backend already supports WebSocket. Check network/firewall settings.

### Issue: Camera permission denied

**Check**:
1. Click camera icon in browser address bar
2. Set permission to "Allow"
3. Reload page

**Solution**: This is a browser permission issue, not a connection issue.

## What's Different?

### Before This Update
- ❌ Required environment variables on Vercel
- ❌ Required environment variables on Render
- ❌ Easy to misconfigure
- ❌ Connection failures common

### After This Update
- ✅ No environment variables needed
- ✅ Automatic environment detection
- ✅ Works out of the box
- ✅ Production-ready immediately

## Technical Details

### Frontend Changes
**File**: `frontend/src/services/api.ts`

- Detects if running on localhost → uses `http://localhost:8000`
- Detects if running elsewhere → uses `https://gesture-vl7k.onrender.com`
- Automatically converts to WebSocket URL (wss://)

### Backend Changes
**File**: `backend/app/core/config.py`

- Production frontend URL hardcoded in CORS origins
- Supports both with/without trailing slash
- No environment variables needed (but can still override if desired)

## Need Help?

See detailed documentation:
- `CONNECTION_SUMMARY.md` - What was changed and why
- `DEPLOYMENT_CONFIG.md` - Complete deployment guide
- `VERIFICATION_REPORT.md` - All tests passed (14/14)
- `README.md` - Full project documentation

## Summary

✅ **Everything is configured and ready**  
✅ **No action required from you**  
✅ **Just deploy and it works!**

---

**Last Updated**: January 7, 2026  
**Status**: 🟢 Ready for Production
