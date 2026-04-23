'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { updateJotting, type Jotting } from '@/lib/jottings'
import FreeEditor from '@/components/editor/FreeEditor'
import ThemeToggle from '@/components/ThemeToggle'

interface Props {
  jotting: Jotting
}

export default function JotEditorClient({ jotting }: Props) {
  const [title, setTitle] = useState(jotting.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(jotting.title)

  async function commitTitle() {
    const next = titleDraft.trim() || '제목 없음'
    setTitle(next)
    setEditingTitle(false)
    if (next !== jotting.title) {
      await updateJotting(jotting.id, { title: next })
    }
  }

  const handleSave = useCallback(async (content: string) => {
    await updateJotting(jotting.id, { content })
  }, [jotting.id])

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white dark:bg-neutral-900">
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
        <Link
          href="/jot"
          className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors flex-shrink-0"
        >
          ← 끄적 목록
        </Link>

        {editingTitle ? (
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitTitle() }
              if (e.key === 'Escape') { setTitleDraft(title); setEditingTitle(false) }
            }}
            autoFocus
            className="flex-1 font-medium text-neutral-800 dark:text-neutral-100 outline-none border-b border-neutral-400 dark:border-neutral-500 bg-transparent"
          />
        ) : (
          <button
            onClick={() => { setTitleDraft(title); setEditingTitle(true) }}
            className="flex-1 text-left font-medium text-neutral-800 dark:text-neutral-100 hover:text-neutral-600 dark:hover:text-neutral-300 truncate transition-colors"
          >
            {title}
          </button>
        )}

        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <FreeEditor
          content={jotting.content}
          onSave={handleSave}
          documentId={jotting.id}
          contentType="jotting"
        />
      </div>
    </div>
  )
}
