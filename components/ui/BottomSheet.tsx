'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  motion,
  AnimatePresence,
  PanInfo,
  useAnimation,
  Variants,
} from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  description?: string
  height?: 'auto' | 'full' | 'half' | 'third' | number
  showHandle?: boolean
  closeOnOverlayClick?: boolean
  closeOnSwipeDown?: boolean
  className?: string
  overlayClassName?: string
  preventScroll?: boolean
  snapPoints?: number[]
  defaultSnapPoint?: number
  onSnapPointChange?: (index: number) => void
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  height = 'auto',
  showHandle = true,
  closeOnOverlayClick = true,
  closeOnSwipeDown = true,
  className,
  overlayClassName,
  preventScroll = true,
  snapPoints = [],
  defaultSnapPoint = 0,
  onSnapPointChange,
}: BottomSheetProps): React.ReactElement | null {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(defaultSnapPoint)
  const sheetRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const dragStartY = useRef(0)
  const sheetHeight = useRef(0)

  // Calculate sheet height based on prop
  const getSheetHeight = useCallback(() => {
    if (typeof height === 'number') return height

    const windowHeight = window.innerHeight
    switch (height) {
      case 'full':
        return windowHeight * 0.95
      case 'half':
        return windowHeight * 0.5
      case 'third':
        return windowHeight * 0.33
      case 'auto':
      default:
        return 'auto'
    }
  }, [height])

  // Prevent scroll when sheet is open
  useEffect(() => {
    if (!preventScroll) return

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)'
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen, preventScroll])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Handle snap points
  const handleSnapPointChange = useCallback(
    (index: number) => {
      setCurrentSnapPoint(index)
      onSnapPointChange?.(index)
    },
    [onSnapPointChange],
  )

  // Handle drag
  const handleDragStart = useCallback((_: any, info: PanInfo) => {
    dragStartY.current = info.point.y
  }, [])

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      const dragDistance = info.point.y - dragStartY.current
      const shouldClose = dragDistance > 150 && closeOnSwipeDown

      if (shouldClose && dragDistance > 0) {
        controls.start({
          y: dragDistance,
          transition: { type: 'spring', damping: 25, stiffness: 300 },
        })
      }
    },
    [controls, closeOnSwipeDown],
  )

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const dragDistance = info.point.y - dragStartY.current
      const velocity = info.velocity.y
      const shouldClose = dragDistance > 150 || velocity > 500

      if (shouldClose && closeOnSwipeDown) {
        onClose()
      } else {
        // Snap back to original position
        controls.start({
          y: 0,
          transition: { type: 'spring', damping: 25, stiffness: 300 },
        })
      }
    },
    [onClose, closeOnSwipeDown, controls],
  )

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const sheetVariants: Variants = {
    hidden: { y: '100%' },
    visible: {
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      y: '100%',
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
  }

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Overlay */}
          <motion.div
            className={cn(
              'absolute inset-0 bg-black/50 backdrop-blur-sm',
              overlayClassName,
            )}
            variants={overlayVariants}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className={cn(
              'relative bg-background border-t shadow-xl rounded-t-xl overflow-hidden',
              'flex flex-col max-h-[90vh]',
              className,
            )}
            variants={sheetVariants}
            drag={closeOnSwipeDown ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            animate={controls}
            style={{
              height: getSheetHeight(),
            }}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center py-2 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || description) && (
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex-1">
                  {title && (
                    <h2 className="text-lg font-semibold leading-none tracking-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-md w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--muted-foreground) var(--muted)',
              }}
            >
              {children}
            </div>

            {/* Snap points indicator */}
            {snapPoints.length > 0 && (
              <div className="flex justify-center py-2 space-x-1">
                {snapPoints.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleSnapPointChange(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      index === currentSnapPoint
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
