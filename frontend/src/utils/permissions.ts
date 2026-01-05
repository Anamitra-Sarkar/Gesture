/**
 * Permission handling utilities for camera and file access
 */

export enum PermissionState {
  PROMPT = 'prompt',
  GRANTED = 'granted',
  DENIED = 'denied',
  UNAVAILABLE = 'unavailable',
}

export interface CameraInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput';
}

export interface PermissionResult {
  state: PermissionState;
  message: string;
  cameras?: CameraInfo[];
}

/**
 * Check if camera API is available in the browser
 */
export function isCameraAvailable(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    navigator.mediaDevices.enumerateDevices
  );
}

/**
 * Check if the browser is mobile
 */
export function isMobileBrowser(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get browser and platform information
 */
export function getBrowserInfo(): {
  browser: string;
  platform: string;
  isMobile: boolean;
} {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  
  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
    browser = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'Safari';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
  } else if (userAgent.indexOf('Edg') > -1) {
    browser = 'Edge';
  }
  
  const platform = navigator.platform;
  const isMobile = isMobileBrowser();
  
  return { browser, platform, isMobile };
}

/**
 * Request camera permissions and enumerate available cameras
 */
export async function requestCameraPermission(): Promise<PermissionResult> {
  if (!isCameraAvailable()) {
    return {
      state: PermissionState.UNAVAILABLE,
      message: 'Camera API is not available in this browser. Please use a modern browser like Chrome, Firefox, or Safari.',
    };
  }

  try {
    // Request camera access with video constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
    });

    // Stop the stream immediately - we just needed permission
    stream.getTracks().forEach(track => track.stop());

    // Enumerate available cameras
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices
      .filter(device => device.kind === 'videoinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
        kind: 'videoinput' as const,
      }));

    return {
      state: PermissionState.GRANTED,
      message: 'Camera access granted successfully.',
      cameras,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return {
          state: PermissionState.DENIED,
          message: 'Camera permission was denied. Please allow camera access in your browser settings.',
        };
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return {
          state: PermissionState.UNAVAILABLE,
          message: 'No camera was found on this device. Please connect a camera and try again.',
        };
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        return {
          state: PermissionState.UNAVAILABLE,
          message: 'Camera is already in use by another application. Please close other apps using the camera.',
        };
      } else if (error.name === 'OverconstrainedError') {
        return {
          state: PermissionState.UNAVAILABLE,
          message: 'Camera does not support the requested configuration. Trying with default settings...',
        };
      }
    }

    return {
      state: PermissionState.UNAVAILABLE,
      message: `Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check current camera permission state without requesting
 */
export async function checkCameraPermission(): Promise<PermissionState> {
  if (!isCameraAvailable()) {
    return PermissionState.UNAVAILABLE;
  }

  try {
    // Try to use the Permissions API if available
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (result.state === 'granted') return PermissionState.GRANTED;
      if (result.state === 'denied') return PermissionState.DENIED;
      return PermissionState.PROMPT;
    }

    // Fallback: Try to enumerate devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput');
    
    if (!hasCamera) {
      return PermissionState.UNAVAILABLE;
    }

    // Check if we have labels (indicates permission was granted before)
    const hasLabels = devices.some(device => device.label !== '');
    return hasLabels ? PermissionState.GRANTED : PermissionState.PROMPT;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return PermissionState.PROMPT;
  }
}

/**
 * Validate file upload
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateVideoFile(
  file: File,
  maxSizeMB: number = 100,
  allowedFormats: string[] = ['.mp4', '.avi', '.webm', '.mov']
): FileValidationResult {
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds the maximum allowed size of ${maxSizeMB}MB.`,
    };
  }

  // Check file format
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedFormats.includes(fileExtension)) {
    return {
      valid: false,
      error: `File format ${fileExtension} is not supported. Allowed formats: ${allowedFormats.join(', ')}`,
    };
  }

  // Check if file is actually a video
  if (!file.type.startsWith('video/')) {
    return {
      valid: false,
      error: 'The selected file does not appear to be a video file.',
    };
  }

  return { valid: true };
}

/**
 * Get user-friendly permission instructions for different browsers
 */
export function getPermissionInstructions(): string {
  const { browser, isMobile } = getBrowserInfo();

  if (isMobile) {
    if (browser === 'Safari') {
      return 'On iOS Safari: Go to Settings → Safari → Camera, and allow camera access.';
    }
    return 'On mobile: Check your browser settings and ensure camera permissions are enabled for this website.';
  }

  switch (browser) {
    case 'Chrome':
      return 'Click the camera icon in the address bar, then select "Allow" for camera access.';
    case 'Firefox':
      return 'Click the camera icon in the address bar, then select "Allow" for camera access.';
    case 'Safari':
      return 'Go to Safari → Settings → Websites → Camera, and allow camera access for this site.';
    case 'Edge':
      return 'Click the camera icon in the address bar, then select "Allow" for camera access.';
    default:
      return 'Please check your browser settings to allow camera access for this website.';
  }
}
