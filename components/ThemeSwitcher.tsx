// components/ThemeSwitcher.tsx
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes'; // We need to install this!

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      aria-label="Toggle Dark Mode"
      type="button"
      className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
};

export default ThemeSwitcher;