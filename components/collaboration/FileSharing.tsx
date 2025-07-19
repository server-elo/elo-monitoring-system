'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  File,
  FileText,
  Image,
  Code,
  Download,
  X,
  AlertCircle,
  Eye,
  Share2,
  Copy,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';

interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  downloadCount: number;
  isPublic: boolean;
  description?: string;
}

interface FileSharingProps {
  files: SharedFile[];
  currentUserId: string;
  onFileUpload: (file: File, description?: string) => Promise<SharedFile>;
  onFileDelete?: (fileId: string) => void;
  onFileDownload?: (fileId: string) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

const FILE_ICONS: Record<string, React.ComponentType<any>> = {
  'text/plain': FileText,
  'application/json': Code,
  'text/javascript': Code,
  'text/typescript': Code,
  'application/solidity': Code,
  'image/png': Image,
  'image/jpeg': Image,
  'image/gif': Image,
  'image/svg+xml': Image,
  'default': File
};

export function FileSharing({
  files,
  currentUserId,
  onFileUpload,
  onFileDelete,
  onFileDownload,
  maxFileSize = 10, // 10MB default
  allowedTypes = [
    'text/plain',
    'application/json',
    'text/javascript',
    'text/typescript',
    'application/solidity',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml'
  ],
  className
}: FileSharingProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    const Icon = FILE_ICONS[type] || FILE_ICONS.default;
    return Icon;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not allowed';
    }

    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const error = validateFile(file);

    if (error) {
      setUploadErrors({ [file.name]: error });
      return;
    }

    setSelectedFile(file);
    setShowUploadDialog(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const fileId = `upload_${Date.now()}_${selectedFile.name}`;
    setUploadProgress({ [fileId]: 0 });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileId] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [fileId]: current + 10 };
        });
      }, 200);

      await onFileUpload(selectedFile, fileDescription);
      
      clearInterval(progressInterval);
      setUploadProgress({ [fileId]: 100 });
      
      setTimeout(() => {
        setUploadProgress(prev => {
          const { [fileId]: _, ...rest } = prev;
          return rest;
        });
      }, 1000);

      setSelectedFile(null);
      setFileDescription('');
      setShowUploadDialog(false);
    } catch (error) {
      setUploadErrors({ [fileId]: 'Upload failed' });
      setUploadProgress(prev => {
        const { [fileId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const copyFileUrl = async (file: SharedFile) => {
    try {
      await navigator.clipboard.writeText(file.url);
      // Show success feedback
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  return (
    <Card className={cn('p-4 bg-white/10 backdrop-blur-md border border-white/20', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Shared Files</h3>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:text-blue-300"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        accept={allowedTypes.join(',')}
      />

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4',
          isDragging
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500'
        )}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-400">
          Drag and drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Max {maxFileSize}MB • {allowedTypes.length} file types supported
        </p>
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {Object.entries(uploadProgress).map(([fileId, progress]) => (
          <motion.div
            key={fileId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-400">Uploading...</span>
              <span className="text-sm text-blue-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Upload errors */}
      <AnimatePresence>
        {Object.entries(uploadErrors).map(([fileName, error]) => (
          <motion.div
            key={fileName}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
              <Button
                onClick={() => setUploadErrors(prev => {
                  const { [fileName]: _, ...rest } = prev;
                  return rest;
                })}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-auto"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Files list */}
      <div className="space-y-2">
        <AnimatePresence>
          {files.map(file => {
            const Icon = getFileIcon(file.type);
            const isOwner = file.uploadedBy === currentUserId;

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
              >
                <Icon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white truncate">{file.name}</span>
                    {file.isPublic && (
                      <Share2 className="w-3 h-3 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.downloadCount} downloads</span>
                    <span>•</span>
                    <span>{file.uploadedAt.toLocaleDateString()}</span>
                  </div>
                  {file.description && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{file.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => {
                      onFileDownload?.(file.id);
                      window.open(file.url, '_blank');
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={() => copyFileUrl(file)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  {file.type.startsWith('text/') && (
                    <Button
                      onClick={() => window.open(file.url, '_blank')}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}

                  {isOwner && onFileDelete && (
                    <Button
                      onClick={() => onFileDelete(file.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {files.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files shared yet</p>
        </div>
      )}

      {/* Upload dialog */}
      <AnimatePresence>
        {showUploadDialog && selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Upload File</h3>
              
              <div className="mb-4">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  {React.createElement(getFileIcon(selectedFile.type), {
                    className: "w-5 h-5 text-blue-400"
                  })}
                  <div>
                    <div className="font-medium text-white">{selectedFile.name}</div>
                    <div className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Add a description for this file..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowUploadDialog(false);
                    setSelectedFile(null);
                    setFileDescription('');
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Upload
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
