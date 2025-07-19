'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Camera,
  Save,
  X,
  Check,
  AlertCircle,
  Upload,
  Trash2,
  Edit3,
  Globe,
  Github,
  Twitter,
  Linkedin,
  MapPin
} from 'lucide-react';
import { UserProfile, SettingsValidationError } from '@/types/settings';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface ProfileSectionProps {
  profile: UserProfile;
  onUpdate: (_data: Partial<UserProfile>) => Promise<{ success: boolean; errors?: SettingsValidationError[] }>;
  isLoading?: boolean;
  validationErrors?: SettingsValidationError[];
  className?: string;
}

export function ProfileSection({
  profile,
  onUpdate,
  isLoading = false,
  validationErrors = [],
  className
}: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(_false);
  const [formData, setFormData] = useState<Partial<UserProfile>>(_profile);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(_null);
  const [isDragOver, setIsDragOver] = useState(_false);
  const [isSaving, setIsSaving] = useState(_false);
  const fileInputRef = useRef<HTMLInputElement>(_null);

  // Get validation error for a specific field
  const getFieldError = useCallback((field: string) => {
    return validationErrors.find(error => error.field === field);
  }, [validationErrors]);

  // Handle form field changes
  const handleFieldChange = useCallback( (field: keyof UserProfile, value: string) => {
    setFormData( prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle avatar upload
  const handleAvatarUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    if (_file.size > 5 * 1024 * 1024) { // 5MB limit
      return;
    }

    const reader = new FileReader(_);
    reader.onload = (_e) => {
      const result = e.target?.result as string;
      setAvatarPreview(_result);
      setFormData( prev => ({ ...prev, avatar: result }));
    };
    reader.readAsDataURL(_file);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(_);
    setIsDragOver(_true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(_);
    setIsDragOver(_false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(_);
    setIsDragOver(_false);
    
    const files = Array.from(_e.dataTransfer.files);
    if (_files.length > 0) {
      handleAvatarUpload(_files[0]);
    }
  }, [handleAvatarUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleAvatarUpload(_files[0]);
    }
  }, [handleAvatarUpload]);

  // Save changes
  const handleSave = useCallback( async () => {
    setIsSaving(_true);
    try {
      const result = await onUpdate(_formData);
      if (_result.success) {
        setIsEditing(_false);
        setAvatarPreview(_null);
      }
    } finally {
      setIsSaving(_false);
    }
  }, [formData, onUpdate]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setFormData(_profile);
    setAvatarPreview(_null);
    setIsEditing(_false);
  }, [profile]);

  // Remove avatar
  const handleRemoveAvatar = useCallback(() => {
    setAvatarPreview(_null);
    setFormData( prev => ({ ...prev, avatar: undefined }));
  }, []);

  return (
    <GlassContainer
      intensity="medium"
      tint="neutral"
      border
      className={cn( 'p-6', className)}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <User className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Profile Information</h2>
        </div>
        
        {!isEditing && (
          <button
            onClick={(_) => setIsEditing(_true)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-start space-x-6">
          <div className="relative">
            <div
              className={cn(
                'relative w-24 h-24 rounded-full overflow-hidden border-2 transition-colors',
                isDragOver ? 'border-blue-400 bg-blue-400/10' : 'border-gray-600',
                isEditing && 'cursor-pointer hover:border-blue-400'
              )}
              onDragOver={isEditing ? handleDragOver : undefined}
              onDragLeave={isEditing ? handleDragLeave : undefined}
              onDrop={isEditing ? handleDrop : undefined}
              onClick={isEditing ? (_) => fileInputRef.current?.click(_) : undefined}
            >
              {(_avatarPreview || formData.avatar || profile.avatar) ? (
                <img
                  src={avatarPreview || formData.avatar || profile.avatar}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {isEditing && (
              <div className="absolute -bottom-2 -right-2 flex space-x-1">
                <button
                  onClick={(_) => fileInputRef.current?.click(_)}
                  className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                  title="Upload new avatar"
                >
                  <Upload className="w-3 h-3" />
                </button>
                
                {(_avatarPreview || formData.avatar || profile.avatar) && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                    title="Remove avatar"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-medium text-white mb-1">
              {profile.displayName || 'No display name'}
            </h3>
            <p className="text-gray-400 text-sm mb-2">{profile.email}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Joined {new Date(_profile.createdAt).toLocaleDateString(_)}</span>
              <span>•</span>
              <span>Last updated {new Date(_profile.updatedAt).toLocaleDateString(_)}</span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name *
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.displayName || ''}
                  onChange={(_e) => handleFieldChange( 'displayName', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors',
                    getFieldError('displayName') 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:ring-blue-500'
                  )}
                  placeholder="Enter your display name"
                />
                {getFieldError('displayName') && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('displayName')?.message}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-white">{profile.displayName || 'Not set'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            {isEditing ? (
              <div>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(_e) => handleFieldChange( 'email', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 pr-10 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors',
                      getFieldError('email') 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:ring-blue-500'
                    )}
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                {getFieldError('email') && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('email')?.message}
                  </p>
                )}
                {!profile.emailVerified && (
                  <p className="mt-1 text-sm text-yellow-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Email not verified
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <p className="text-white">{profile.email}</p>
                {profile.emailVerified ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
              </div>
            )}
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(_e) => handleFieldChange( 'firstName', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Enter your first name"
              />
            ) : (
              <p className="text-white">{profile.firstName || 'Not set'}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(_e) => handleFieldChange( 'lastName', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Enter your last name"
              />
            ) : (
              <p className="text-white">{profile.lastName || 'Not set'}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            {isEditing ? (
              <div className="relative">
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(_e) => handleFieldChange( 'location', e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="City, Country"
                />
                <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            ) : (
              <p className="text-white">{profile.location || 'Not set'}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            {isEditing ? (
              <div className="relative">
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(_e) => handleFieldChange( 'website', e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="https://yourwebsite.com"
                />
                <Globe className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            ) : (
              <p className="text-white">
                {profile.website ? (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {profile.website}
                  </a>
                ) : (
                  'Not set'
                )}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bio
          </label>
          {isEditing ? (
            <textarea
              value={formData.bio || ''}
              onChange={(_e) => handleFieldChange( 'bio', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="text-white whitespace-pre-wrap">{profile.bio || 'No bio provided'}</p>
          )}
        </div>

        {/* Social Links */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GitHub */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                GitHub Username
              </label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.githubUsername || ''}
                    onChange={(_e) => handleFieldChange( 'githubUsername', e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="username"
                  />
                  <Github className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <p className="text-white">
                  {profile.githubUsername ? (
                    <a 
                      href={`https://github.com/${profile.githubUsername}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      {profile.githubUsername}
                    </a>
                  ) : (
                    'Not set'
                  )}
                </p>
              )}
            </div>

            {/* Twitter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Twitter Username
              </label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.twitterUsername || ''}
                    onChange={(_e) => handleFieldChange( 'twitterUsername', e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="username"
                  />
                  <Twitter className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <p className="text-white">
                  {profile.twitterUsername ? (
                    <a 
                      href={`https://twitter.com/${profile.twitterUsername}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      {profile.twitterUsername}
                    </a>
                  ) : (
                    'Not set'
                  )}
                </p>
              )}
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LinkedIn Username
              </label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.linkedinUsername || ''}
                    onChange={(_e) => handleFieldChange( 'linkedinUsername', e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="username"
                  />
                  <Linkedin className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <p className="text-white">
                  {profile.linkedinUsername ? (
                    <a 
                      href={`https://linkedin.com/in/${profile.linkedinUsername}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      {profile.linkedinUsername}
                    </a>
                  ) : (
                    'Not set'
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-end space-x-3 pt-4 border-t border-gray-600"
            >
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassContainer>
  );
}
