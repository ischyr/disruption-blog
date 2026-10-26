import { isCommand, hasPrompt } from './commands'

// Gives commands a terminal feel, after rehype-highlight has run:
//  - in code blocks, each line that is a command gets an empty
//    `.term-prompt` span in front (the ➜ is drawn by CSS ::before, so it is
//    never copied). Blocks whose author already pasted prompts, and script
//    listings (#!), are left alone.
//  - inline code that is a command gets the `inline-cmd` class.

const textOf = (node) =>
  node.type === 'text' ? node.value : (node.children || []).map(textOf).join('')

const prompt = () => ({
  type: 'element',
  tagName: 'span',
  properties: { className: ['term-prompt'], ariaHidden: 'true' },
  children: [],
})

function promptLines(code) {
  // split the highlighted children into lines; bail out if a highlighted
  // span crosses a line break (multi-line strings/comments)
  const lines = [[]]
  for (const child of code.children) {
    if (child.type !== 'text') {
      if (textOf(child).includes('\n')) return
      lines[lines.length - 1].push(child)
      continue
    }
    child.value.split('\n').forEach((part, i) => {
      if (i > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ type: 'text', value: part })
    })
  }

  const texts = lines.map((nodes) => nodes.map(textOf).join(''))
  const first = texts.find((t) => t.trim())
  if (!first || first.trim().startsWith('#!')) return
  // a pasted prompt means the author shows the session as-is; a lone `# …`
  // is far more often a comment than a root prompt, so it doesn't count
  if (texts.some((t) => hasPrompt(t) && !/^#\s/.test(t.trim()))) return
  if (!texts.some(isCommand)) return

  const children = []
  lines.forEach((nodes, i) => {
    if (i > 0) children.push({ type: 'text', value: '\n' })
    if (isCommand(texts[i])) children.push(prompt())
    children.push(...nodes)
  })
  code.children = children
}

function walk(node, parent) {
  if (node.type === 'element' && node.tagName === 'code') {
    const cls = node.properties.className || []
    if (parent?.tagName === 'pre') {
      if (!cls.includes('language-mermaid')) promptLines(node)
    }
    else if (/\s/.test(textOf(node).trim()) && isCommand(textOf(node))) {
      node.properties.className = [...cls, 'inline-cmd']
    }
    return
  }
  for (const child of node.children || []) walk(child, node)
}

export default function rehypeTerminal() {
  return (tree) => walk(tree, null)
}
