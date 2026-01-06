/**
 * API Service for communicating with the backend
 */

const API_BASE_URL = import.meta. env.VITE_API_URL || 'http://localhost:8000';

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl:  string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    console.log('[ApiService] Initialized with base URL:', this.baseUrl);
  }

  // Camera endpoints
  async startCamera() {
    const response = await fetch(`${this.baseUrl}/camera/start`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start camera');
    return response.json();
  }

  async stopCamera() {
    const response = await fetch(`${this.baseUrl}/camera/stop`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to stop camera');
    return response.json();
  }

  async getCameraStatus() {
    const response = await fetch(`${this.baseUrl}/camera/status`);
    if (!response.ok) throw new Error('Failed to get camera status');
    return response.json();
  }

  async resetTracking() {
    const response = await fetch(`${this.baseUrl}/camera/reset`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to reset tracking');
    return response.json();
  }

  // Video endpoints
  async uploadVideo(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/video/upload`, {
      method: 'POST',
      body:  formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload video');
    }

    return response.json();
  }

  async getVideoInfo(fileId: string) {
    const response = await fetch(`${this.baseUrl}/video/info/${fileId}`);
    if (!response.ok) throw new Error('Failed to get video info');
    return response.json();
  }

  async deleteVideo(fileId: string) {
    const response = await fetch(`${this.baseUrl}/video/${fileId}`, {
      method: 'DELETE',
    });
    if (!response. ok) throw new Error('Failed to delete video');
    return response. json();
  }

  // WebSocket
  createWebSocket(): WebSocket {
    // Properly convert HTTP/HTTPS to WS/WSS
    // This regex handles both http:  and https: protocols correctly
    const wsUrl = this.baseUrl.replace(/^http(s)?:/, 'ws$1:') + '/ws/live';
    
    console.log('[ApiService] Creating WebSocket connection to:', wsUrl);
    console.log('[ApiService] Base URL:', this.baseUrl);
    
    return new WebSocket(wsUrl);
  }
}

export const apiService = new ApiService();
