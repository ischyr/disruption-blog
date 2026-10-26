import { useEffect } from 'react'
import { site } from '../config'

// Browser-tab title for the current page: "Blog · 0xd1s", or the site title
// when none is given. Keep the format in sync with scripts/gen-pages.mjs,
// which bakes the same titles into the static HTML for crawlers.
export const pageTitle = (title) => (title ? `${title} · ${site.handle}` : site.title)

export function useTitle(title) {
  useEffect(() => {
    document.title = pageTitle(title)
  }, [title])
}
