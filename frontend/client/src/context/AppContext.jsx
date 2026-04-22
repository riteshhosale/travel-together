import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [preferences, setPreferences] = useLocalStorage('fg.preferences', {
    preferredBudget: '',
    preferredDestination: '',
    travelStyle: 'any',
    bio: '',
    reducedMotion: false,
  });

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
