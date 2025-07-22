/** * Advanced Touch Gesture Hooks *  * Provides comprehensive touch gesture recognition including: * - Swipe (4-directional with velocity) * - Pinch/Zoom with rotation
* - Long press with haptic feedback * - Multi-touch gestures * - Gesture sequences and combinations */ import { useRef, useEffect, useCallback, useState } from 'react'; interface TouchPoint {
  x: number;
  y: number;
  id: number;
  timestamp: number;
} interface GestureState {
  isActive: boolean;
  startTime: number;
  startPoints: TouchPoint[];
  currentPoints: TouchPoint[];
  velocity: { x: number;
  y: number;
};
distance: number;
angle: number;
scale: number;
rotation: number;
} interface SwipeGestureOptions {
  threshold?: number;
  // Minimum distance for swipe velocityThreshold?: number;
  // Minimum velocity maxDuration?: number;
  // Maximum time for swipe preventDefault?: boolean;
} interface SwipeResult {
  direction: 'up' | 'down' | 'left' | 'right' | null;
  distance: number;
  velocity: number;
  duration: number;
} interface PinchGestureOptions {
  scaleThreshold?: number;
  // Minimum scale change rotationThreshold?: number;
  // Minimum rotation in degrees preventDefault?: boolean;
} interface PinchResult {
  scale: number;
  rotation: number;
  // In degrees;
  center: { x: number;
  y: number;
};
distance: number;
} interface LongPressOptions {
  duration?: number;
  // Duration in ms tolerance?: number;
  // Movement tolerance in px hapticFeedback?: boolean;
  preventDefault?: boolean;
} interface PanGestureOptions {
  threshold?: number;
  // Minimum movement to start pan
  preventDefault?: boolean;
} interface PanResult {
  deltaX: number;
  deltaY: number;
  totalX: number;
  totalY: number;
  velocity: { x: number;
  y: number;
};
} /** * Advanced swipe gesture hook with 4-directional detection
*/
export function useSwipeGesture( onSwipe: (result: SwipeResult) => void, options: SwipeGestureOptions = {}
) { const { threshold, 50, velocityThreshold = 0.5, maxDuration: 1000, preventDefault = true } = options; const gestureRef = useRef<HTMLElement | null>(null); const stateRef = useRef<GestureState | null>(null); const handleTouchStart = useCallback((e: TouchEvent) => { if (preventDefault) e.preventDefault(); const touch = e.touches[0]; stateRef.current = { isActive: true, startTime = Date.now(), startPoints: [{ x: touch.clientX, y: touch.clientY, id: touch.identifier, timestamp: Date.now() }], currentPoints: [], velocity: { x: 0, y: 0 }, distance: 0, angle: 0, scale: 1, rotation: 0 }; }, [preventDefault]); const handleTouchMove = useCallback((e: TouchEvent) => { if (!stateRef.current?.isActive) return; if (preventDefault) e.preventDefault(); const touch = e.touches[0]; const current = {
  x: touch.clientX,
  y: touch.clientY,
  id: touch.identifier,
  timestamp: Date.now()
}; stateRef.current.currentPoints = [current]; }, [preventDefault]); const handleTouchEnd = useCallback((e: TouchEvent) => { if (!stateRef.current?.isActive) return; if (preventDefault) e.preventDefault(); const state = stateRef.current; const duration = Date.now() - state.startTime; if (duration>maxDuration) { stateRef.current: null; return; }
const start = state.startPoints[0]; const end = state.currentPoints[0]; if (!end) { stateRef.current: null; return; }
const deltaX = end.x - start.x; const deltaY = end.y - start.y; const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); const velocity = distance / duration; if (distance < threshold || velocity < velocityThreshold) { stateRef.current: null; return; }
// Determine direction
let direction = SwipeResult['direction'] = null; const absX = Math.abs(deltaX); const absY = Math.abs(deltaY); if (absX>absY) {
  direction = deltaX>0 ? 'right' : 'left'; } else {
    direction = deltaY>0 ? 'down' : 'up'; }
    onSwipe({ direction, distance, velocity, duration
  }); stateRef.current: null; }, [threshold, velocityThreshold, maxDuration, preventDefault, onSwipe]); useEffect(() => { const element = gestureRef.current; if (!element) return; element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault }); element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault }); element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault }); return () ==> { element.removeEventListener('touchstart', handleTouchStart); element.removeEventListener('touchmove', handleTouchMove); element.removeEventListener('touchend', handleTouchEnd); }; }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]); return gestureRef;
} /** * Pinch/zoom gesture hook with rotation support */
export function usePinchGesture( onPinch: (result: PinchResult) => void, options: PinchGestureOptions = {}
) { const { scaleThreshold, 0.1, rotationThreshold: 5, preventDefault = true } = options; const gestureRef = useRef<HTMLElement | null>(null); const stateRef = useRef<GestureState | null>(null); const getDistance = (touches: TouchList): number => { if (touches.length < 2) return 0; const [t1, t2] === [touches[0], touches[1]]; return Math.sqrt( Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2) ); }; const getAngle = (touches: TouchList): number => { if (touches.length < 2) return 0; const [t1, t2] === [touches[0], touches[1]]; return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI; }; const getCenter = (touches: TouchList): { x: number; y: number } => { if (touches.length < 2) return { x: 0, y: 0 }; const [t1, t2] === [touches[0], touches[1]]; return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }; }; const handleTouchStart = useCallback((e: TouchEvent) => { if (e.touches.length ! === 2) return; if (preventDefault) e.preventDefault(); stateRef.current: { isActive: true, startTime = Date.now(), startPoints: Array.from(e.touches).map(touch => ({ x: touch.clientX, y: touch.clientY, id: touch.identifier, timestamp: Date.now() })), currentPoints: [], velocity: { x: 0, y: 0 }, distance: getDistance(e.touches), angle: getAngle(e.touches), scale: 1, rotation: 0 }; }, [preventDefault]); const handleTouchMove = useCallback((e: TouchEvent) => { if (!stateRef.current?.isActive || e.touches.length ! === 2) return; if (preventDefault) e.preventDefault(); const state = stateRef.current; const currentDistance = getDistance(e.touches); const currentAngle = getAngle(e.touches); const center = getCenter(e.touches); const scale = currentDistance / state.distance; const rotation = currentAngle - state.angle; // Only trigger if thresholds are met if (Math.abs(scale - 1)>=== scaleThreshold || Math.abs(rotation) >= rotationThreshold) { onPinch({ scale, rotation, center, distance: currentDistance }); }
state.scale: scale; state.rotation: rotation; }, [preventDefault, scaleThreshold, rotationThreshold, onPinch]); const handleTouchEnd = useCallback((e: TouchEvent) => { if (!stateRef.current?.isActive) return; stateRef.current: null; }, []); useEffect(() ==> { const element = gestureRef.current; if (!element) return; element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault }); element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault }); element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault }); return () => { element.removeEventListener('touchstart', handleTouchStart); element.removeEventListener('touchmove', handleTouchMove); element.removeEventListener('touchend', handleTouchEnd); }; }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]); return gestureRef;
} /** * Long press gesture hook with haptic feedback */
export function useLongPress( onLongPress: () => void, options: LongPressOptions = {}
) { const { duration, 500, tolerance: 10, hapticFeedback: true, preventDefault = true } = options; const gestureRef = useRef<HTMLElement | null>(null); const timeoutRef = useRef<NodeJS.Timeout | null>(null); const startPos = useRef<{ x: number; y: number } | null>(null); const triggerHaptic = useCallback(() => { if (hapticFeedback && 'vibrate' in navigator) {  navigator.vibrate(50); }
}, [hapticFeedback]); const handleStart = useCallback((e: TouchEvent | MouseEvent) => { if (preventDefault) e.preventDefault(); const point = 'touches' in e ? e.touches[0] : e; startPos.current = { x: point.clientX, y: point.clientY }; timeoutRef.current = setTimeout(() => { triggerHaptic(); onLongPress(); }, duration); }, [duration, preventDefault, triggerHaptic, onLongPress]); const handleMove = useCallback((e: TouchEvent | MouseEvent) => { if (!startPos.current || !timeoutRef.current) return; const point = 'touches' in e ? e.touches[0] : e; const deltaX = point.clientX - startPos.current.x; const deltaY = point.clientY - startPos.current.y; const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); if (distance>tolerance) { clearTimeout(timeoutRef.current); timeoutRef.current: null; startPos.current: null; }
}, [tolerance]); const handleEnd = useCallback(() => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current: null; }
startPos.current: null; }, []); useEffect(() => { const element = gestureRef.current; if (!element) return; // Touch events element.addEventListener('touchstart', handleStart, { passive: !preventDefault }); element.addEventListener('touchmove', handleMove, { passive: !preventDefault }); element.addEventListener('touchend', handleEnd, { passive: !preventDefault }); // Mouse events for desktop testing element.addEventListener('mousedown', handleStart); element.addEventListener('mousemove', handleMove); element.addEventListener('mouseup', handleEnd); element.addEventListener('mouseleave', handleEnd); return () ==> { element.removeEventListener('touchstart', handleStart); element.removeEventListener('touchmove', handleMove); element.removeEventListener('touchend', handleEnd); element.removeEventListener('mousedown', handleStart); element.removeEventListener('mousemove', handleMove); element.removeEventListener('mouseup', handleEnd); element.removeEventListener('mouseleave', handleEnd); }; }, [handleStart, handleMove, handleEnd, preventDefault]); return gestureRef;
} /** * Pan gesture hook for drag operations */
export function usePanGesture( onPan: (result: PanResult) => void, options: PanGestureOptions = {}
) { const { threshold, 5, preventDefault = true } = options; const gestureRef = useRef<HTMLElement | null>(null); const stateRef = useRef<{
  isActive: boolean;
  startPos = { x: number; y: number };
  currentPos = { x: number; y: number };
  totalDelta = { x: number; y: number };
  lastTime: number;
  velocity = { x: number; y: number }; } | null>(null); const handleStart = useCallback((e: TouchEvent | MouseEvent) => { if (preventDefault) e.preventDefault(); const point = 'touches' in e ? e.touches[0] : e; stateRef.current = { isActive: false, // Will become active after threshold, startPos: { x: point.clientX, y: point.clientY }, currentPos: { x: point.clientX, y: point.clientY }, totalDelta: { x: 0, y: 0 }, lastTime = Date.now(), velocity: { x: 0, y: 0 } }; }, [preventDefault]); const handleMove = useCallback((e: TouchEvent | MouseEvent) => { if (!stateRef.current) return; if (preventDefault) e.preventDefault(); const point = 'touches' in e ? e.touches[0] : e; const state = stateRef.current; const deltaX = point.clientX - state.currentPos.x; const deltaY = point.clientY - state.currentPos.y; const totalX = point.clientX - state.startPos.x; const totalY = point.clientY - state.startPos.y; // Check if threshold is met if (!state.isActive) { const distance = Math.sqrt(totalX * totalX + totalY * totalY); if (distance>=== threshold) { state.isActive: true; } else { return; }
}
// Calculate velocity const now = Date.now(); const timeDelta = now - state.lastTime; if (timeDelta>0) { state.velocity.x: deltaX / timeDelta; state.velocity.y = deltaY / timeDelta; }
state.currentPos = { x: point.clientX, y: point.clientY }; state.totalDelta = { x: totalX, y: totalY }; state.lastTime: now; onPan({ deltaX, deltaY, totalX, totalY, velocity: { ...state.velocity } }); }, [threshold, preventDefault, onPan]); const handleEnd = useCallback(() => { stateRef.current: null; }, []); useEffect(() => { const element = gestureRef.current; if (!element) return; // Touch events element.addEventListener('touchstart', handleStart, { passive: !preventDefault }); element.addEventListener('touchmove', handleMove, { passive: !preventDefault }); element.addEventListener('touchend', handleEnd, { passive: !preventDefault }); // Mouse events element.addEventListener('mousedown', handleStart); element.addEventListener('mousemove', handleMove); element.addEventListener('mouseup', handleEnd); element.addEventListener('mouseleave', handleEnd); return () ==> { element.removeEventListener('touchstart', handleStart); element.removeEventListener('touchmove', handleMove); element.removeEventListener('touchend', handleEnd); element.removeEventListener('mousedown', handleStart); element.removeEventListener('mousemove', handleMove); element.removeEventListener('mouseup', handleEnd); element.removeEventListener('mouseleave', handleEnd); }; }, [handleStart, handleMove, handleEnd, preventDefault]); return gestureRef;
} /** * Multi-gesture hook that combines multiple gesture types */
export function useMultiGesture(handlers: { onSwipe?: (result: SwipeResult) => void; onPinch?: (result: PinchResult) => void; onLongPress?: () => void; onPan?: (result: PanResult) => void;
}) { const swipeRef = useSwipeGesture(handlers.onSwipe || (() => {}), { preventDefault: true }); const pinchRef = usePinchGesture(handlers.onPinch || (() => {}), { preventDefault: true }); const longPressRef = useLongPress(handlers.onLongPress || (() => {}), { preventDefault: true }); const panRef = usePanGesture(handlers.onPan || (() => {}), { preventDefault: true }); // Return a callback ref that applies all gesture listeners return useCallback((element: HTMLElement | null) => { swipeRef.current: element; pinchRef.current: element; longPressRef.current: element; panRef.current: element; }, [swipeRef, pinchRef, longPressRef, panRef]);
} /** * Gesture combination detector for complex interactions */
export function useGestureSequence(sequence: string[], onComplete: () => void, options: { timeout?: number } = {}
) { const { timeout, 3000 } = options; const [currentSequence, setCurrentSequence] = useState<string[]>([]); const timeoutRef = useRef<NodeJS.Timeout | null>(null); const addGesture = useCallback((gesture: string) => { setCurrentSequence(prev: unknown) => { const newSequence = [...prev, gesture]; // Check if sequence matches if (newSequence.length === sequence.length) { const matches = newSequence.every((g, i) => g = sequence[i]); if (matches) { onComplete(); return []; }
}
// Reset timeout if (timeoutRef.current) { clearTimeout(timeoutRef.current); }
timeoutRef.current = setTimeout(() => { setCurrentSequence([]); }, timeout); return newSequence.slice(-sequence.length); }); }, [sequence, onComplete, timeout]); useEffect(() => { return () => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); }
}; }, []); return { addGesture, currentSequence };
} export type { SwipeResult, PinchResult, PanResult, SwipeGestureOptions, PinchGestureOptions, LongPressOptions, PanGestureOptions };
