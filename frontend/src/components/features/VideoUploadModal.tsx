/**
 * Video Upload Modal with drag-and-drop support
 */
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { validateVideoFile } from '../../utils/permissions';
import type { VideoUploadResponse } from '../../types';
import './VideoUploadModal.css';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (response: VideoUploadResponse) => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file using the utility function
    const validation = validateVideoFile(file, 100, ['.mp4', '.avi', '.webm', '.mov']);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid file. Please check file format and size.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress (real implementation would use XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiService.uploadVideo(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);
      
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }

      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="modal-container"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <div className="modal-content glass-card">
              {/* Header */}
              <div className="modal-header">
                <h2>Upload Video</h2>
                <button className="close-btn" onClick={handleClose}>
                  <X size={24} />
                </button>
              </div>

              {/* Body */}
              <div className="modal-body">
                {!selectedFile ? (
                  <div
                    className={`upload-area ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={48} />
                    <h3>Drop video here or click to browse</h3>
                    <p>Supports MP4, AVI, WebM, MOV (Max 100MB)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/avi,video/webm,video/quicktime"
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div className="file-selected">
                    <div className="file-info">
                      <File size={48} />
                      <div className="file-details">
                        <h3>{selectedFile.name}</h3>
                        <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>

                    {uploading && (
                      <div className="upload-progress">
                        <div className="progress-bar-container">
                          <motion.div
                            className="progress-bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p>{uploadProgress}%</p>
                      </div>
                    )}

                    {success && (
                      <motion.div
                        className="success-message"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <CheckCircle size={24} />
                        <span>Upload successful!</span>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div
                        className="error-message"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle size={24} />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {!uploading && !success && (
                      <div className="file-actions">
                        <button
                          className="btn btn-primary"
                          onClick={handleUpload}
                        >
                          Upload
                        </button>
                        <button
                          className="btn"
                          onClick={() => setSelectedFile(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
