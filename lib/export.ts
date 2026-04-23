import { Editor } from '@tiptap/react'
import { JSONContent } from '@tiptap/core'

function inlineToMd(node: JSONContent): string {
  if (!node) return ''
  if (node.type !== 'text') return ''
  let text = node.text || ''
  const marks = node.marks || []
  if (marks.some((m) => m.type === 'bold')) text = `**${text}**`
  if (marks.some((m) => m.type === 'effect')) text = `*${text}*`
  return text
}

function nodeToMd(node: JSONContent, sceneIndex: { n: number }): string {
  if (!node) return ''
  const inline = () => (node.content || []).map(inlineToMd).join('')
  const children = () => (node.content || []).map((n) => nodeToMd(n, sceneIndex)).filter(Boolean).join('\n')

  switch (node.type) {
    case 'doc':
      return children()
    case 'slugline':
      sceneIndex.n++
      return `## ${inline()}`
    case 'character':
      return `[${inline()}]`
    case 'dialogue':
      return inline()
    case 'stageDirection':
      return `(${inline().replace(/^\(|\)$/g, '')})`
    case 'transition':
      return `>> ${inline()}`
    case 'paragraph':
      return inline()
    case 'blockquote':
      return children().split('\n').map((l) => `> ${l}`).join('\n')
    default:
      return inline()
  }
}

export function exportMarkdown(editor: Editor) {
  const json = editor.getJSON()
  const idx = { n: 0 }
  const md = (json.content || [])
    .map((n) => nodeToMd(n, idx))
    .filter(Boolean)
    .join('\n\n')

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'scenario.md'
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPDF() {
  window.print()
}
