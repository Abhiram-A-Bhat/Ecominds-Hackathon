const THEME_KEY = 'guardian-campus-theme';

export function getTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage unavailable */ }
  return 'dark';
}

export function setTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent('guardian-theme-change', { detail: next }));
}

export function initializeTheme() {
  document.documentElement.dataset.theme = getTheme();
}
