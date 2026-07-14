import { useCallback, useState } from 'react';

const USER_KEY = 'health-tracker:currentUserId';
const TOKEN_KEY = 'health-tracker:token';

export function useCurrentUser() {
  const [userId, setUserId] = useState<number | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? Number(raw) : null;
  });

  const selectUser = useCallback((id: number) => {
    localStorage.setItem(USER_KEY, String(id));
    setUserId(id);
  }, []);

  const clearUser = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUserId(null);
  }, []);

  const setToken = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  return { userId, selectUser, clearUser, setToken, getToken };
}
