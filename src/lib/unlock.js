// Session memory for unlocked active-machine write-ups (see LockedPost).

export const unlockKey = (slug) => `unlocked:${slug}`

// true when this session already unlocked the post with its current password
export function wasUnlocked(slug, hash) {
  try {
    return sessionStorage.getItem(unlockKey(slug)) === hash
  } catch {
    return false
  }
}
