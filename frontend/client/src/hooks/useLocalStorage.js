import { useEffect, useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [hydratedKey, setHydratedKey] = useState(key);

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
      const storedValue = window.localStorage.getItem(key);
      setValue(storedValue ? JSON.parse(storedValue) : initialValue);
    } catch (error) {
      setValue(initialValue);
    }
    setHydratedKey(key);
  }, [key, initialValue]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (hydratedKey !== key) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore write errors to keep UI functional even in restricted environments.
    }
  }, [hydratedKey, key, value]);

  return [value, setValue];
};
