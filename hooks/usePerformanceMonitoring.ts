import { useEffect, useState } from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
}

export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fps: 60,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measurePerformance = (): void => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
        
        setMetrics({
          renderTime: now - lastTime,
          memoryUsage: memoryUsage / 1048576, // Convert to MB
          fps,
        });

        frameCount = 0;
        lastTime = now;
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    animationId = requestAnimationFrame(measurePerformance);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return metrics;
};