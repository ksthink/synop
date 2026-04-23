'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { JSONContent } from '@tiptap/core'

import { Slugline } from './extensions/Slugline'
import { Character } from './extensions/Character'
import { Dialogue } from './extensions/Dialogue'
import { Transition } from './extensions/Transition'
import { Effect } from './extensions/Effect'
import { StageDirection } from './extensions/StageDirection'
import Toolbar from './Toolbar'
import Toc from './Toc'
import AssetPanel from './AssetPanel'

import { setupAutoSave, loadDraft } from '@/lib/storage'
import { getProject, updateProjectContent } from '@/lib/projects'
import { initSounds, playKeySound } from '@/lib/typewriterSound'

interface Props {
  projectId?: string
}

function extractCharacters(doc: JSONContent): string[] {
  const names: string[] = []
  function walk(node: JSONContent) {
    if (node.type === 'character') {
      const name = (node.content || []).map((n) => n.text || '').join('').trim()
      if (name) names.push(name)
    }
    ;(node.content || []).forEach(walk)
  }
  walk(doc)
  return [...new Set(names)]
}

interface Suggestion {
  names: string[]
  rect: DOMRect | null
}

export default function Editor({ projectId }: Props) {
  const router = useRouter()
  const [characters, setCharacters] = useState<string[]>([])
  const [suggestion, setSuggestion] = useState<Suggestion>({ names: [], rect: null })
  const [focusMode, setFocusMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        italic: false,
        blockquote: {},
      }),
      Slugline,
      Character,
      Dialogue,
      Transition,
      Effect,
      StageDirection,
      Placeholder.configure({
        placeholder: '@ 또는 ## 으로 씬을 시작하세요...',
      }),
      CharacterCount,
    ],
    editorProps: {
      attributes: { class: 'outline-none min-h-screen' },
    },
    immediatelyRender: false,
  })

  // Typewriter sounds
  useEffect(() => {
    if (!editor) return
    let ready = false
    const dom = editor.view.dom

    const onKeydown = (e: KeyboardEvent) => {
      if (!ready) { ready = true; initSounds() }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.length !== 1 && e.key !== 'Enter') return
      playKeySound(e.key === 'Enter')
    }

    dom.addEventListener('keydown', onKeydown)
    return () => dom.removeEventListener('keydown', onKeydown)
  }, [editor])

  // Load content
  useEffect(() => {
    if (!editor) return
    if (projectId) {
      const project = getProject(projectId)
      if (project?.content) editor.commands.setContent(project.content as any)
      let t: ReturnType<typeof setTimeout> | null = null
      editor.on('update', () => {
        if (t) clearTimeout(t)
        t = setTimeout(() => updateProjectContent(projectId, editor.getJSON()), 500)
      })
    } else {
      const draft = loadDraft()
      if (draft) editor.commands.setContent(draft as any)
      setupAutoSave(editor)
    }
  }, [editor, projectId])

  // Track character names and autocomplete
  const updateSuggestion = useCallback(() => {
    if (!editor) return

    const allChars = extractCharacters(editor.getJSON())
    setCharacters(allChars)

    const { $from } = editor.state.selection
    if ($from.parent.type.name !== 'character') {
      setSuggestion({ names: [], rect: null })
      return
    }

    const query = $from.parent.textContent.toUpperCase()
    const matches = allChars.filter(
      (c) => c.toUpperCase().startsWith(query) && c.toUpperCase() !== query
    )

    if (matches.length === 0) {
      setSuggestion({ names: [], rect: null })
      return
    }

    const coords = editor.view.coordsAtPos(editor.state.selection.from)
    const rect = new DOMRect(coords.left, coords.bottom, 0, 0)
    setSuggestion({ names: matches.slice(0, 5), rect })
  }, [editor])

  useEffect(() => {
    if (!editor) return
    editor.on('update', updateSuggestion)
    editor.on('selectionUpdate', updateSuggestion)
    return () => {
      editor.off('update', updateSuggestion)
      editor.off('selectionUpdate', updateSuggestion)
    }
  }, [editor, updateSuggestion])

  function applySuggestion(name: string) {
    if (!editor) return
    const { $from } = editor.state.selection
    editor.chain()
      .setTextSelection({ from: $from.start(), to: $from.end() })
      .insertContent(name)
      .run()
    setSuggestion({ names: [], rect: null })
  }

  const charCount = editor?.storage.characterCount?.characters() ?? 0
  const backHref = projectId ? '/projects' : '/'

  return (
    <div
      ref={containerRef}
      className={`flex flex-col min-h-screen bg-white dark:bg-neutral-900 ${focusMode ? 'focus-mode' : ''}`}
    >
      <Toolbar
        editor={editor}
        onBack={() => router.push(backHref)}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((v) => !v)}
      />

      <div className="flex-1 relative">
        <div className="mx-auto w-full max-w-2xl px-8 py-12">
          <EditorContent editor={editor} />
        </div>

        <aside className="no-print hidden xl:block fixed right-8 top-14 w-44 max-h-[calc(100vh-80px)] overflow-y-auto space-y-6">
          <Toc editor={editor} />
          {characters.length > 0 && <AssetPanel characters={characters} />}
        </aside>
      </div>

      {/* Character autocomplete */}
      {suggestion.names.length > 0 && suggestion.rect && (
        <div
          className="fixed z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-32"
          style={{ left: suggestion.rect.left, top: suggestion.rect.top + 4 }}
        >
          {suggestion.names.map((name) => (
            <button
              key={name}
              onMouseDown={(e) => { e.preventDefault(); applySuggestion(name) }}
              className="w-full text-left px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="no-print fixed bottom-4 right-6 text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
        {charCount.toLocaleString()}자
      </div>
    </div>
  )
}
