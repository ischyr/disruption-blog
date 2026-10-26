// Jump to a piece of text inside the rendered post (a command line in a code
// block, or inline code): scroll it into view, highlight the exact line and
// pulse its block. Shared by the "Commands used" panel and the Ctrl+K palette.

// Offset so a jumped-to line lands comfortably below the sticky navbar.
const SCROLL_OFFSET = 190

let highlightTimer

// Find `text` inside the rendered article: code blocks first, then inline
// code. Returns a Range over the match so we can scroll to the exact line.
function findRange(text) {
  const root = document.querySelector('.post .markdown')
  if (!root) return null
  for (const el of root.querySelectorAll('pre, :not(pre) > code')) {
    if (!el.textContent.includes(text)) continue
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const nodes = []
    let full = ''
    while (walker.nextNode()) {
      nodes.push({ node: walker.currentNode, start: full.length })
      full += walker.currentNode.nodeValue
    }
    const at = full.indexOf(text)
    const locate = (offset) => {
      const hit = nodes.findLast((n) => n.start <= offset)
      return [hit.node, offset - hit.start]
    }
    const range = document.createRange()
    range.setStart(...locate(at))
    range.setEnd(...locate(at + text.length))
    return { range, block: el.closest('.codeblock') || el }
  }
  return null
}

// Smooth-scroll so the range sits SCROLL_OFFSET below the top. Lazy images
// above it can load mid-scroll and push it down, so keep re-aiming for a
// moment — unless the reader starts scrolling on their own.
let cancelAim = () => {}

function scrollToRange(range, onSettled) {
  cancelAim()
  // smooth for nearby targets; a long post can put a command thousands of
  // pixels away, where a smooth scroll takes seconds — jump there instantly
  const aim = () => {
    const delta = range.getBoundingClientRect().top - SCROLL_OFFSET
    window.scrollTo({
      top: window.scrollY + delta,
      behavior: Math.abs(delta) > window.innerHeight * 2.5 ? 'instant' : 'smooth',
    })
  }
  let tries = 0
  let timer
  const check = () => {
    const off = Math.abs(range.getBoundingClientRect().top - SCROLL_OFFSET)
    if (off > 24 && tries++ < 8) {
      aim()
      timer = setTimeout(check, 400)
    } else stop()
  }
  // a newer jump cancels this one silently; settling or the reader taking
  // over the scroll both count as "arrived"
  const stop = (arrived = true) => {
    clearTimeout(timer)
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
    window.removeEventListener('keydown', stop)
    if (arrived) onSettled()
  }
  window.addEventListener('wheel', stop, { passive: true, once: true })
  window.addEventListener('touchstart', stop, { passive: true, once: true })
  window.addEventListener('keydown', stop, { once: true })
  cancelAim = () => stop(false)
  aim()
  timer = setTimeout(check, 500)
}

// Returns false when the text isn't on the page.
export function jumpTo(text) {
  const found = findRange(text)
  if (!found) return false
  const { range, block } = found

  // long output blocks are folded; unfold before scrolling into them (the
  // re-aim loop absorbs the layout change)
  if (block.classList.contains('codeblock')) {
    block.dispatchEvent(new CustomEvent('codeblock:expand'))
  }

  // highlight the exact line where supported (shown during the scroll, then
  // cleared shortly after arriving), and pulse the surrounding block on arrival
  const canHighlight = Boolean(window.CSS?.highlights && window.Highlight)
  if (canHighlight) {
    clearTimeout(highlightTimer)
    CSS.highlights.set('cmd-hit', new window.Highlight(range))
  }
  scrollToRange(range, () => {
    if (canHighlight) {
      // one shared timer, so an earlier jump can't clear a newer highlight
      clearTimeout(highlightTimer)
      highlightTimer = setTimeout(() => CSS.highlights.delete('cmd-hit'), 1800)
    }
    block.classList.remove('cmd-flash')
    void block.offsetWidth // restart the animation if jumped to twice
    block.classList.add('cmd-flash')
    block.addEventListener('animationend', () => block.classList.remove('cmd-flash'), {
      once: true,
    })
  })
  return true
}
