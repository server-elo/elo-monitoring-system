'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  responsive?: boolean;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  responsive = true,
  aspectRatio,
  objectFit = 'cover',
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (responsive ? 
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' : 
    undefined
  );

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Handle image error with fallback
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.();
    }
  };

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (w: number = 10, h: number = 10) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  };

  // Auto-generate blur placeholder if not provided
  const autoBlurDataURL = blurDataURL || (placeholder === 'blur' ? generateBlurDataURL() : undefined);

  // Container styles for aspect ratio
  const containerStyles = aspectRatio ? {
    aspectRatio,
    position: 'relative' as const,
  } : {};

  if (fill) {
    return (
      <div 
        className={cn('relative overflow-hidden', className)}
        style={containerStyles}
      >
        <Image
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          fill
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={autoBlurDataURL}
          sizes={responsiveSizes}
          onLoad={handleLoad}
          onError={handleError}
          style={{ objectFit }}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
        />
        
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        )}
        
        {/* Error state */}
        {hasError && !fallbackSrc && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">Image unavailable</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn('relative', className)}
      style={containerStyles}
    >
      <Image
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={autoBlurDataURL}
        sizes={responsiveSizes}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        style={{ objectFit }}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
      />
      
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      
      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded"
          style={{ width, height }}
        >
          <div className="text-gray-400 text-center">
            <svg className="w-6 h-6 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Image unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Avatar component with optimized loading
interface OptimizedAvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackInitials?: string;
  priority?: boolean;
}

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackInitials,
  priority = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const sizePixels = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        {...sizePixels[size]}
        priority={priority}
        quality={90}
        placeholder="blur"
        objectFit="cover"
        fallbackSrc="/avatars/default.jpg"
        className="rounded-full"
      />
      
      {/* Fallback with initials */}
      {fallbackInitials && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {fallbackInitials}
        </div>
      )}
    </div>
  );
};

// Hero image component with advanced optimization
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  overlay?: boolean;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  src,
  alt,
  className = '',
  priority = true,
  overlay = false,
}) => {
  return (
    <div className={cn('relative w-full h-full', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={90}
        placeholder="blur"
        sizes="100vw"
        objectFit="cover"
        className="z-0"
      />
      
      {/* Optional overlay for better text readability */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
      )}
    </div>
  );
};

export default OptimizedImage;
