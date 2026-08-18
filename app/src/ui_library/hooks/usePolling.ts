import { useEffect, useRef } from 'react';

/**
 * Run `callback` every `intervalMs` while `enabled`.
 *
 * The callback is held in a ref, so an inline arrow function will not restart
 * the timer on every render — only `intervalMs` and `enabled` do. Pass
 * `enabled: false` to stop, e.g. once a job reaches a terminal status.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
): void {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;
    const id = setInterval(() => {
      void saved.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
