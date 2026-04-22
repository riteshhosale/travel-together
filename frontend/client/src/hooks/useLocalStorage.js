import { useEffect, useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const getInitialValue = () => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      return initialValue;
    }
  };

  const [value, setValue] = useState(getInitialValue);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore write errors to keep UI functional even in restricted environments.
    }
  }, [key, value]);

  return [value, setValue];
};
