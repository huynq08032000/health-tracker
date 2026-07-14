import { useEffect, useRef, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';

const DB_TIMEOUT_MS = 15 * 60 * 1000;

export function useAppLoading() {
  const isFetching = useIsFetching();
  const hasLoaded = useRef(false);
  const lastVisibleTime = useRef(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    lastVisibleTime.current = Date.now();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastVisibleTime.current > DB_TIMEOUT_MS) {
          hasLoaded.current = false;
        }
        lastVisibleTime.current = now;
      } else {
        lastVisibleTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (hasLoaded.current) return;

    if (isFetching > 0) {
      setIsLoading(true);
    } else {
      hasLoaded.current = true;
      setIsLoading(false);
    }
  }, [isFetching]);

  return { isLoading, hasLoaded: hasLoaded.current };
}
