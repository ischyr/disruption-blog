// Theme preference: 'system' | 'light' | 'dark'. Resolved to 'light'/'dark'
// and applied as data-theme on <html>. An inline script in index.html applies
// the stored choice before paint to avoid a flash.
const KEY = 'theme'

export function getThemePref() {
  try {
    return localStorage.getItem(KEY) || 'system'
  } catch {
    return 'system'
  }
}

export function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export function resolveTheme(pref = getThemePref()) {
  return pref === 'system' ? systemTheme() : pref
}

export function applyTheme(pref) {
  const resolved = resolveTheme(pref)
  document.documentElement.setAttribute('data-theme', resolved)
  try {
    localStorage.setItem(KEY, pref)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: resolved }))
}
