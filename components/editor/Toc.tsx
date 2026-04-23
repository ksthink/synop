'use client'

import { Editor } from '@tiptap/react'
import { JSONContent } from '@tiptap/core'
import { useEffect, useState } from 'react'

interface TocItem {
  text: string
  index: number
  duration: number // seconds
}

function extractScenes(doc: JSONContent): TocItem[] {
  const items: TocItem[] = []
  const nodes = doc.content || []
  let sceneIndex = 0

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type !== 'slugline') continue

    const text = (node.content || []).map((n) => n.text || '').join('')
    if (!text) { sceneIndex++; continue }

    // Count characters in this scene (up to next slugline)
    let charCount = 0
    for (let j = i + 1; j < nodes.length && nodes[j].type !== 'slugline'; j++) {
      charCount += (nodes[j].content || [])
        .map((n: JSONContent) => n.text || '').join('').length
    }

    // ~500 chars per minute (Korean screenplay estimate)
    const duration = Math.max(10, Math.round((charCount / 500) * 60))

    items.push({ text, index: sceneIndex++, duration })
  }
  return items
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `~${seconds}초`
  return `~${Math.round(seconds / 60)}분`
}

export default function Toc({ editor }: { editor: Editor | null }) {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (!editor) return
    const update = () => setItems(extractScenes(editor.getJSON()))
    update()
    editor.on('update', update)
    return () => { editor.off('update', update) }
  }, [editor])

  if (items.length === 0) return null

  function scrollTo(index: number) {
    if (!editor) return
    const headings = editor.view.dom.querySelectorAll('h2, [data-type="slugline"]')
    headings[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveIndex(index)
  }

  return (
    <nav className="flex flex-col gap-1">
      <p className="text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase mb-2">
        목차
      </p>
      {items.map((item) => (
        <button
          key={item.index}
          onClick={() => scrollTo(item.index)}
          className={`text-left leading-snug transition-colors px-1 py-0.5 rounded group ${
            activeIndex === item.index
              ? 'text-neutral-800 dark:text-neutral-100'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <span className="text-[10px] font-mono mr-1 opacity-60">S#{item.index + 1}</span>
          <span className="text-xs truncate block">{item.text}</span>
          <span className="text-[10px] opacity-40">{formatDuration(item.duration)}</span>
        </button>
      ))}
    </nav>
  )
}
