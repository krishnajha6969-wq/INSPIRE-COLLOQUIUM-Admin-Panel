'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const current = document.documentElement.dataset.theme as 'light' | 'dark';
    if (current) {
      setTheme(current);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem('inspire.theme', nextTheme);
    } catch {
      // localStorage may fail in restricted environments
    }
  };

  return (
    <button onClick={toggleTheme} aria-pressed={theme === 'dark'}>
      {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
    </button>
  );
}
