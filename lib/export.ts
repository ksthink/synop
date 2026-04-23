import { Editor } from '@tiptap/react'
import { JSONContent } from '@tiptap/core'

function inlineToMd(node: JSONContent): string {
  if (!node || node.type !== 'text') return ''
  let text = node.text || ''
  const marks = node.marks || []
  if (marks.some((m) => m.type === 'bold')) text = `**${text}**`
  if (marks.some((m) => m.type === 'italic')) text = `*${text}*`
  return text
}

function nodeToMd(node: JSONContent): string {
  if (!node) return ''
  const inline = () => (node.content || []).map(inlineToMd).join('')
  const children = () => (node.content || []).map(nodeToMd).filter(Boolean).join('\n')

  switch (node.type) {
    case 'doc':
      return children()
    case 'sceneHeading':
      return `## ${inline()}`
    case 'characterCue':
      return `**${inline()}**`
    case 'dialogue':
      return inline()
    case 'stageDirection':
      return `*(${inline()})*`
    case 'paragraph':
      return inline()
    case 'heading': {
      const level = node.attrs?.level ?? 2
      return `${'#'.repeat(level)} ${inline()}`
    }
    case 'bulletList':
      return children()
    case 'listItem':
      return `- ${children()}`
    default:
      return inline()
  }
}

export function exportMarkdown(editor: Editor, title?: string) {
  const json = editor.getJSON()
  const lines = (json.content || [])
    .map(nodeToMd)
    .filter(Boolean)
    .join('\n\n')
  const md = title ? `# ${title}\n\n${lines}` : lines

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  a.download = `${title ?? 'scenario'}_${date}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function exportPDF() {
  window.print()
}
