import React, { useState } from 'react';
import { MoonIcon } from '@phosphor-icons/react/dist/csr/Moon';
import { SunIcon } from '@phosphor-icons/react/dist/csr/Sun';
import { getTheme, setTheme } from '../utils/theme';

export function ThemeToggle() {
  const [theme, updateTheme] = useState(getTheme);
  const next = theme === 'dark' ? 'light' : 'dark';

  const toggle = () => {
    setTheme(next);
    updateTheme(next);
  };

  return (
    <button
      type="button"
      className="tb-btn theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? <SunIcon size={16} weight="bold" /> : <MoonIcon size={16} weight="bold" />}
      <span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
