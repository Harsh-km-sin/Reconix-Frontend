import { useEffect, useState } from 'react';

/**
 * The value, but only after it has stopped changing for `delay` ms.
 *
 * Use for search inputs: bind the input to state as usual, and pass the
 * debounced value to the effect that hits the API.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
