import { useEffect, useRef, useState } from 'react';
import { RunTrackingEngine } from './RunTrackingEngine';

/**
 * Gives components a stable RunTrackingEngine instance and re-renders
 * whenever its internal state changes (distance, pace, elapsed time, etc.).
 */
export function useRunTrackingEngine(): RunTrackingEngine {
  const engineRef = useRef<RunTrackingEngine>();
  if (!engineRef.current) {
    engineRef.current = new RunTrackingEngine();
  }
  const [, forceRender] = useState(0);

  useEffect(() => {
    const unsubscribe = engineRef.current!.subscribe(() => forceRender((n) => n + 1));
    return unsubscribe;
  }, []);

  return engineRef.current;
}
