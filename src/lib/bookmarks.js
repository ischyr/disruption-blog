// Reading list persisted in localStorage. A tiny external store so every
// BookmarkButton, the navbar count, and the /saved page stay in sync.
import { useSyncExternalStore } from 'react'

const KEY = 'saved-posts'

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

// cached snapshot — useSyncExternalStore needs a stable reference between
// renders, so we only replace it when the data actually changes.
let cache = load()
const listeners = new Set()

function emit() {
  listeners.forEach((fn) => fn())
}

function commit(next) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable / full — keep the in-memory copy */
  }
  emit()
}

export function getSaved() {
  return cache
}

export function isSaved(slug) {
  return cache.includes(slug)
}

export function toggleSaved(slug) {
  commit(cache.includes(slug) ? cache.filter((s) => s !== slug) : [slug, ...cache])
}

function subscribe(fn) {
  listeners.add(fn)
  const onStorage = (e) => {
    if (e.key === KEY) {
      cache = load() // another tab changed it
      emit()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

// Subscribe to the saved-slug list (newest first).
export function useSaved() {
  return useSyncExternalStore(subscribe, getSaved, getSaved)
}
