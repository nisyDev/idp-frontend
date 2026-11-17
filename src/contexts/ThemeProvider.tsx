import { useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { darkTheme, lightTheme, ThemeContext } from './theme';
import type { ThemeMode } from './theme';

const systemThemeQuery = '(prefers-color-scheme: dark)';

function getSystemTheme(): ThemeMode {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(systemThemeQuery).matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getSystemTheme);

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const preference = window.matchMedia(systemThemeQuery);
    const followSystemTheme = () => {
      setMode(preference.matches ? 'dark' : 'light');
    };

    preference.addEventListener('change', followSystemTheme);
    // Reconcile changes between initialization and subscription before paint.
    followSystemTheme();

    return () => preference.removeEventListener('change', followSystemTheme);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const theme = mode === 'light' ? lightTheme : darkTheme;

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
