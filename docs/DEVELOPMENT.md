# Development Guide

## Setup for Development

### Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18 or higher
- **Git**: Latest version
- **Camera**: Webcam for live mode testing
- **OS**: Linux, macOS, or Windows with WSL

### Initial Setup

1. **Clone the Repository**

```bash
git clone https://github.com/Anamitra-Sarkar/Gesture.git
cd Gesture
```

2. **Backend Setup**

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env for your configuration
nano .env
```

3. **Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env
nano .env
```

## Development Workflow

### Running in Development Mode

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

### Hot Reloading

- **Backend**: Set `DEBUG_MODE=true` in `.env` for auto-reload
- **Frontend**: Vite provides automatic hot module replacement

## Code Structure

### Adding New Features

#### 1. Backend - New API Endpoint

Create a new endpoint in `backend/app/api/`:

```python
# backend/app/api/new_feature.py
from fastapi import APIRouter

router = APIRouter(prefix="/feature", tags=["feature"])

@router.get("/")
async def get_feature():
    return {"status": "ok"}
```

Register in `backend/main.py`:

```python
from app.api import new_feature_router
app.include_router(new_feature_router)
```

#### 2. Frontend - New Component

Create component in `frontend/src/components/features/`:

```typescript
// NewFeature.tsx
import React from 'react';
import './NewFeature.css';

export const NewFeature: React.FC = () => {
  return <div>New Feature</div>;
};
```

Import in parent component:

```typescript
import { NewFeature } from './components/features/NewFeature';
```

### Adding New Gestures

#### 1. Update Backend Gesture Recognizer

Edit `backend/app/services/hand_tracking.py`:

```python
def _detect_new_gesture(self, landmarks: np.ndarray) -> float:
    """Detect new gesture based on landmark geometry."""
    # Implement detection logic
    # Return confidence score 0.0-1.0
    return confidence
```

Add to recognition pipeline:

```python
gesture_scores = {
    GestureType.NEW_GESTURE: self._detect_new_gesture(landmarks),
    # ... existing gestures
}
```

#### 2. Update Frontend Types

Edit `frontend/src/types/index.ts`:

```typescript
export const GestureType = {
  // ... existing types
  NEW_GESTURE: 'new_gesture',
} as const;
```

Update gesture displays in components.

## Testing

### Backend Testing

```bash
cd backend
source venv/bin/activate

# Run tests (if test suite exists)
pytest

# Test specific endpoint
curl http://localhost:8000/health

# Test with Python
python -m pytest tests/
```

### Frontend Testing

```bash
cd frontend

# Build test
npm run build

# Lint check
npm run lint  # If configured

# Type check
npm run type-check  # If configured
```

### Manual Testing Checklist

- [ ] Camera starts successfully
- [ ] WebSocket connects without errors
- [ ] Landmarks render on canvas
- [ ] Gestures detected with reasonable confidence
- [ ] Video upload works
- [ ] Performance metrics update in real-time
- [ ] UI animations smooth
- [ ] Responsive design works on different screens

## Debugging

### Backend Debugging

1. **Enable Debug Logging**

```python
# backend/.env
DEBUG_MODE=true
```

2. **Check Logs**

```bash
tail -f backend/logs/app.log
```

3. **Python Debugger**

```python
import pdb; pdb.set_trace()
```

### Frontend Debugging

1. **Browser DevTools**
   - Console: Check errors and logs
   - Network: Monitor WebSocket and API calls
   - Performance: Profile rendering

2. **React DevTools**
   - Install browser extension
   - Inspect component tree and state

3. **Debug Configuration**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

## Code Style

### Backend (Python)

- **PEP 8**: Follow Python style guide
- **Type Hints**: Use for function parameters and returns
- **Docstrings**: Document classes and functions
- **Imports**: Group by standard, third-party, local

Example:

```python
def process_frame(
    frame: np.ndarray,
    draw_landmarks: bool = True
) -> HandTrackingResult:
    """
    Process a frame for hand tracking.
    
    Args:
        frame: Input frame in BGR format
        draw_landmarks: Whether to annotate frame
        
    Returns:
        HandTrackingResult with landmarks and gestures
    """
    pass
```

### Frontend (TypeScript/React)

- **Functional Components**: Use hooks instead of classes
- **Type Safety**: Define interfaces for props
- **Naming**: PascalCase for components, camelCase for functions
- **Comments**: Document complex logic

Example:

```typescript
interface MyComponentProps {
  data: DataType;
  onUpdate: (value: string) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  data,
  onUpdate,
}) => {
  // Implementation
};
```

## Performance Optimization

### Backend

1. **Profile Code**

```python
import cProfile
cProfile.run('your_function()')
```

2. **Reduce Frame Processing**

```env
FRAME_SKIP=2  # Process every 2nd frame
```

3. **Adjust Model Complexity**

```env
MP_MODEL_COMPLEXITY=0  # Faster, less accurate
```

### Frontend

1. **React DevTools Profiler**
   - Record performance
   - Identify slow renders

2. **Optimize Re-renders**

```typescript
const MemoizedComponent = React.memo(Component);
```

3. **Use useMemo and useCallback**

```typescript
const expensiveValue = useMemo(() => computeExpensive(data), [data]);
const handleClick = useCallback(() => { /* ... */ }, []);
```

## Common Issues

### Backend

**Issue**: Camera not opening

```bash
# Check camera availability
ls -la /dev/video*

# Try different camera index
CAMERA_INDEX=1
```

**Issue**: MediaPipe not found

```bash
# Reinstall
pip uninstall mediapipe
pip install mediapipe==0.10.31
```

### Frontend

**Issue**: CORS errors

```typescript
// backend/app/core/config.py
CORS_ORIGINS = ["http://localhost:5173"]
```

**Issue**: WebSocket connection failed

```typescript
// Check backend is running
// Verify VITE_API_URL in .env
VITE_API_URL=http://localhost:8000
```

## Git Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes

### Commit Messages

```
<type>: <subject>

[optional body]

Types: feat, fix, docs, style, refactor, test, chore
```

Example:

```
feat: Add peace sign gesture detection

- Implement detection logic based on finger positions
- Add confidence scoring
- Update frontend gesture display
```

### Pull Request Process

1. Create feature branch
2. Make changes and commit
3. Push to origin
4. Open pull request
5. Request review
6. Address feedback
7. Merge when approved

## Documentation

### Update Documentation

When making changes:

1. Update README if user-facing
2. Update ARCHITECTURE.md if structural
3. Add inline comments for complex logic
4. Update type definitions

### Generate API Docs

FastAPI automatically generates docs at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deployment

### Production Build

**Backend:**

```bash
cd backend
pip install -r requirements.txt
python main.py  # With DEBUG_MODE=false
```

**Frontend:**

```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Resources

### Documentation

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [MediaPipe Docs](https://developers.google.com/mediapipe)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

### Learning

- [Computer Vision with Python](https://opencv.org/courses/)
- [Advanced React Patterns](https://www.patterns.dev/)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)

## Getting Help

- Check existing issues on GitHub
- Read error messages carefully
- Use browser DevTools and Python debugger
- Review logs (backend/logs/app.log)
- Test with minimal examples

## Contributing

See CONTRIBUTING.md for guidelines on:

- Code of conduct
- Pull request process
- Coding standards
- Testing requirements

---

**Need Help?** Open an issue on GitHub or reach out to maintainers.
