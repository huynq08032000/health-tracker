import { useEffect, useRef, useState } from 'react';

export function useAppLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;

    let cancelled = false;

    async function checkHealth() {
      try {
        const base = (import.meta.env.VITE_API_BASE_URL || '').trim();
        const res = await fetch(`${base}/api/health`, { method: 'GET' });
        if (!cancelled && res.ok) {
          hasLoaded.current = true;
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setTimeout(checkHealth, 500);
        }
      }
    }

    checkHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isLoading, hasLoaded: hasLoaded.current };
}
