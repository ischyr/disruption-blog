// Tiny shared helpers for the Ctrl+K palette, kept apart from the palette
// itself so importing them (navbar button, launcher) doesn't pull the palette
// and its post index into the main bundle.

export const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export const PALETTE_EVENT = 'palette:open'

// Anything can open the palette by calling this.
export const openPalette = () => window.dispatchEvent(new Event(PALETTE_EVENT))
