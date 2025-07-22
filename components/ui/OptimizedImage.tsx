import React, { ReactElement } from 'react';
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority: false,
  className,
  objectFit = "cover"
}: OptimizedImageProps): void {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div
      className={cn(
        "bg-gray-200 flex items-center justify-center",
        className,
      )}><span className="text-gray-500">Failed to load image</span>
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden", className)}>
    <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    priority={priority}
    className={cn(
      "duration-700 ease-in-out",
      isLoading
      ? "scale-110 blur-2xl grayscale"
      : "scale-100 blur-0 grayscale-0",
    )}
    onLoadingComplete={() => setIsLoading(false)}
    onError={() => setError(true)}
    style={{
      objectFit,
      width: width ? `${width}px` : "100%",
      height: height ? `${height}px` : "auto"
    }}
    />
    </div>
  );
}
