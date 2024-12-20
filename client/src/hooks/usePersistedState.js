import { useState, useEffect } from 'react';

export function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    const persistedValue = localStorage.getItem(key);
    return persistedValue ? JSON.parse(persistedValue) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
} 