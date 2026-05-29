import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AUTH_TOKEN_CHANGE_EVENT } from '../services/auth';
import { getUserIdFromToken } from '../utils/userId';
import { DEFAULT_PREFERENCES, getPreferencesStorageKey } from '../utils/preferencesStorage';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [activeUserId, setActiveUserId] = useState(() => getUserIdFromToken());

  useEffect(() => {
    const syncActiveUser = () => {
      setActiveUserId(getUserIdFromToken());
    };

    syncActiveUser();

    window.addEventListener(AUTH_TOKEN_CHANGE_EVENT, syncActiveUser);
    window.addEventListener('storage', syncActiveUser);

    return () => {
      window.removeEventListener(AUTH_TOKEN_CHANGE_EVENT, syncActiveUser);
      window.removeEventListener('storage', syncActiveUser);
    };
  }, []);

  const storageKey = useMemo(() => getPreferencesStorageKey(activeUserId), [activeUserId]);
  const [preferences, setPreferences] = useLocalStorage(storageKey, DEFAULT_PREFERENCES);

  const value = useMemo(
    () => ({
      preferences,
      setPreferences,
    }),
    [preferences, setPreferences]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return context;
};
