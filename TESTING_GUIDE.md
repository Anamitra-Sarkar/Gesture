# Phantome - Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend running at `http://localhost:8000` (or your deployed URL)
2. Frontend running at `http://localhost:5173` (or your deployed URL)
3. Camera-enabled device (desktop or mobile)
4. Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

## 🎥 Test 1: Camera & WebSocket Lifecycle (CRITICAL)

### Steps:
1. Open the application
2. Click **"Start Camera"** button
3. Permission modal should appear
4. Click **"Allow Camera Access"**
5. Browser permission prompt appears
6. Grant camera permission

### Expected Results:
✅ Camera preview appears **IMMEDIATELY** (within 1 second)  
✅ Status shows: "Connecting to backend..." with spinning icon  
✅ Status changes to: "Backend Ready" within 10 seconds  
✅ Your reflection is visible (mirrored like a mirror)  
✅ If you move your hands, landmarks appear on screen  
✅ Gestures are detected and shown in the dashboard  
✅ FPS counter shows ~15-30 FPS  

### Error Scenarios:
**If backend is down:**
- Status shows: "Backend Error - Camera works locally"  
- Camera preview still works (local)  
- No landmarks appear (backend processing unavailable)  

**If backend times out:**
- After 10 seconds: "Connection timeout. Backend did not respond in time."  
- Camera preview still visible  
- Clear error message, no infinite loading  

---

## 📱 Test 2: Mobile Responsiveness

### Devices to Test:
- iPhone SE (320px width)
- iPhone 12/13 (390px width)
- iPad (768px width)
- Desktop (1920px+ width)

### Steps:
1. Open app on mobile device
2. Rotate between portrait and landscape
3. Try all UI interactions

### Expected Results:
✅ All controls visible and accessible  
✅ No horizontal scrolling  
✅ Modals centered and don't overflow  
✅ Canvas scales properly  
✅ Logo and branding visible  
✅ Text readable (not too small)  
✅ Buttons touch-friendly (min 44x44px)  
✅ Safe-area respected on notched devices  

---

## 📤 Test 3: Video Upload

### Steps:
1. Click **"Upload Video"** button
2. Modal opens centered
3. Drag/drop a video file (MP4, AVI, WebM, MOV)
4. Or click to browse and select file
5. Click **"Upload"** button
6. Wait for upload to complete

### Expected Results:
✅ Modal perfectly centered on screen  
✅ File validation works (format, size checks)  
✅ Progress bar shows percentage  
✅ Status text: "Uploading video to server..."  
✅ On success: Green message "Upload successful!"  
✅ Modal auto-closes after 2 seconds  
✅ On failure: Red message with actual error  
✅ Retry button appears on failure  

### Error Scenarios:
**Invalid file type:**
- Shows: "Invalid file. Please check file format and size."  

**File too large (>100MB):**
- Shows: "File size exceeds 100MB limit"  

**Backend error:**
- Shows actual backend error message  
- Retry button available  

---

## 🎨 Test 4: Branding & Visual Polish

### Visual Checks:
✅ Browser tab shows: "Phantome - Hand Gesture Recognition"  
✅ Favicon is Phantome icon (hand with gradient)  
✅ Header has Phantome logo (floating animation)  
✅ Header text: "Phantome" in neon cyan  
✅ Footer: "Phantome © 2026"  
✅ Logo visible on mobile (smaller but present)  
✅ Color scheme: Cyan (#00f0ff) + Magenta (#ff00ff)  
✅ Consistent glassmorphism effects throughout  

---

## 🔄 Test 5: Connection State Transitions

### Scenario A: Normal Flow
1. Start with backend running
2. Click "Start Camera"
3. Grant permission

**States:**
1. Disconnected (gray)
2. Connecting to backend... (blue, spinning)
3. Backend Ready (green, checkmark)

### Scenario B: Backend Unavailable
1. Stop backend server
2. Click "Start Camera"
3. Grant permission

**States:**
1. Disconnected (gray)
2. Connecting to backend... (blue, spinning)
3. Backend Error - Camera works locally (red, warning)

**Verify:**
- Camera preview still works
- Clear explanation of issue
- No infinite loading

### Scenario C: Backend Recovery
1. Start with backend down (Test 5B)
2. Start camera (shows error)
3. Start backend server
4. Click "Stop Camera" then "Start Camera"

**States:**
- Should recover and show "Backend Ready"

---

## ⚠️ Test 6: Error Handling

### Test 6A: Camera Permission Denied
1. Click "Start Camera"
2. Deny camera permission in browser

**Expected:**
- Alert: "Camera access denied. Please allow camera permissions..."
- No infinite loading
- Clear instructions for recovery

### Test 6B: Camera In Use
1. Open Zoom/Teams/another app using camera
2. Try to start camera in Phantome

**Expected:**
- Alert: "Camera is in use by another application..."
- Clear instructions

### Test 6C: No Camera Found
1. Test on device without camera (if possible)

**Expected:**
- Alert: "No camera found. Please connect a camera..."

---

## 🚀 Test 7: Performance

### Metrics to Check:
- **FPS**: Should be 15-30 FPS consistently
- **Latency**: Processing time 15-50ms per frame
- **CPU**: Moderate usage (check browser task manager)
- **Memory**: Should not continuously increase (no leaks)

### Steps:
1. Start camera
2. Move hands around for 2-3 minutes
3. Check performance metrics in UI
4. Check browser DevTools Performance tab

**Expected:**
- Stable FPS (no major drops)
- No memory leaks
- Smooth animations

---

## 🖥️ Cross-Browser Testing

### Browsers to Test:
- Chrome/Edge (Chromium)
- Firefox
- Safari (macOS/iOS)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### Check:
✅ Camera works in all browsers  
✅ WebSocket connects  
✅ UI renders correctly  
✅ Animations smooth  
✅ No console errors  
✅ Responsive design works  

---

## 📋 Final Checklist

Before marking as complete:

### Functionality:
- [ ] Camera preview immediate on permission
- [ ] Backend connects asynchronously
- [ ] WebSocket states transition correctly
- [ ] Video upload works end-to-end
- [ ] All modals centered properly
- [ ] No infinite loading states
- [ ] Error messages are user-friendly
- [ ] Retry mechanisms work

### Mobile:
- [ ] Works on iPhone
- [ ] Works on Android
- [ ] Works on iPad
- [ ] Portrait & landscape both work
- [ ] Touch controls responsive
- [ ] No viewport issues

### Branding:
- [ ] Phantome logo visible
- [ ] Favicon correct
- [ ] Browser title correct
- [ ] Color scheme consistent
- [ ] Professional appearance

### Quality:
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] No security vulnerabilities
- [ ] Performance acceptable

---

## 🐛 Common Issues & Solutions

### Issue: "Connection timeout"
**Solution:** 
- Check backend is running
- Check CORS settings
- Check firewall/network

### Issue: Camera black screen
**Solution:**
- Check camera not in use by other app
- Check browser permissions
- Reload page

### Issue: Modal off-center on mobile
**Solution:**
- Should be fixed in this implementation
- Check viewport meta tag present
- Check safe-area CSS applied

### Issue: "Not Found" on upload
**Solution:**
- Backend should be fixed
- Check upload endpoint is `/video/upload`
- Check backend logs

---

## ✅ Success Criteria

The application is ready when:

1. ✅ Non-technical user can open app and use immediately
2. ✅ Camera works on first try (or clear error why not)
3. ✅ All features work on mobile
4. ✅ Upload succeeds without confusion
5. ✅ Branding is professional and consistent
6. ✅ No technical jargon in UI
7. ✅ No infinite loading states anywhere
8. ✅ Clear path forward from any error state

---

## 🎯 Client Handoff Ready

If all tests pass, the application is:
- ✅ Production-ready
- ✅ Client-facing
- ✅ Mobile-friendly
- ✅ Professionally branded
- ✅ User-friendly
- ✅ Error-resilient

**The application is ready for client handoff.**

---

*Phantome © 2026 - Built for Production*
