import { useState, useEffect } from 'react';

export function useServiceWorker() {
  const [ready, setReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setReady(false);
      return;
    }

    let cancelled = false;

    navigator.serviceWorker.ready
      .then((reg) => {
        if (!cancelled) {
          setReady(true);
          setRegistration(reg);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
          setRegistration(null);
        }
      });

    const handleControllerChange = () => {
      navigator.serviceWorker.ready
        .then((reg) => {
          if (!cancelled) {
            setReady(true);
            setRegistration(reg);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setReady(false);
            setRegistration(null);
          }
        });
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return { ready, registration };
}
