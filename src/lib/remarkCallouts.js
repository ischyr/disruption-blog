import { visit } from 'unist-util-visit'

// GitHub-style callouts:  > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] /
// [!CAUTION] — plus a custom [!EXPLOIT] box for write-ups.
const TITLES = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
  exploit: 'Exploit',
}

export default function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node) => {
      const first = node.children[0]
      if (!first || first.type !== 'paragraph') return
      const textNode = first.children[0]
      if (!textNode || textNode.type !== 'text') return

      const m = /^\[!(\w+)\]\s*(.*)/.exec(textNode.value)
      if (!m) return

      const type = m[1].toLowerCase()
      const title =
        TITLES[type] || type.charAt(0).toUpperCase() + type.slice(1)
      const rest = m[2]

      if (rest) {
        textNode.value = rest
      } else {
        first.children.shift() // drop the "[!TYPE]" text
        const lead = first.children[0]
        if (lead && lead.type === 'break') first.children.shift()
        if (first.children.length === 0) node.children.shift()
      }

      node.data = {
        hName: 'div',
        hProperties: { className: ['callout', `callout-${type}`] },
      }
      node.children.unshift({
        type: 'paragraph',
        data: { hProperties: { className: ['callout-title'] } },
        children: [{ type: 'text', value: title }],
      })
    })
  }
}
