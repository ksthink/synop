'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { JSONContent } from '@tiptap/core'

import { SceneHeading } from './extensions/SceneHeading'
import { CharacterCue } from './extensions/CharacterCue'
import { Dialogue } from './extensions/Dialogue'
import { StageDirection } from './extensions/StageDirection'

import ShareButton from '@/components/share/ShareButton'
import VersionPanel from './VersionPanel'
import FontSelector from './FontSelector'
import DictionaryPanel from './DictionaryPanel'

import { getDocument, upsertDocument } from '@/lib/documents'
import { saveVersion } from '@/lib/versions'
import { getCharacterNames, addCharacterIfMissing } from '@/lib/characters'
import { exportMarkdown, exportPDF } from '@/lib/export'
import { useEditorFont } from '@/hooks/useEditorFont'

interface Props {
  projectId: string
}

function extractScenes(doc: JSONContent): { text: string; index: number }[] {
  const items: { text: string; index: number }[] = []
  let i = 0
  for (const node of doc.content ?? []) {
    if (node.type === 'sceneHeading') {
      const text = (node.content ?? []).map((n) => n.text ?? '').join('')
      items.push({ text: text || '(제목 없음)', index: i++ })
    }
  }
  return items
}

export default function ScenarioEditor({ projectId }: Props) {
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentTitle, setDocumentTitle] = useState('')
  const [characters, setCharacters] = useState<string[]>([])
  const [scenes, setScenes] = useState<{ text: string; index: number }[]>([])
  const [activeScene, setActiveScene] = useState<number>(-1)
  const [tocOpen, setTocOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [acQuery, setAcQuery] = useState('')
  const [acRect, setAcRect] = useState<DOMRect | null>(null)
  const acSuggestions = characters.filter(
    (c) => acQuery === '' || c.toLowerCase().startsWith(acQuery.toLowerCase())
  )

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { font, changeFont, currentFamily } = useEditorFont()

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
        blockquote: false,
      }),
      SceneHeading,
      CharacterCue,
      Dialogue,
      StageDirection,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'sceneHeading') return '장소 (시간)'
          if (node.type.name === 'characterCue') return '인물명'
          if (node.type.name === 'paragraph') return '# 씬 시작, [ 대사 화자...'
          return ''
        },
        showOnlyCurrent: true,
      }),
    ],
    editorProps: {
      attributes: { class: 'outline-none' },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor) return
    ;(async () => {
      let doc = await getDocument(projectId, 'scenario')
      if (!doc) doc = await upsertDocument(projectId, 'scenario', '')
      setDocumentId(doc.id)
      if (doc.content) {
        try {
          editor.commands.setContent(JSON.parse(doc.content))
        } catch {
          // plain text fallback
        }
      }
    })()
  }, [editor, projectId])

  useEffect(() => {
    getCharacterNames(projectId).then(setCharacters)
  }, [projectId])

  const handleUpdate = useCallback(() => {
    if (!editor || !documentId) return

    setScenes(extractScenes(editor.getJSON()))

    const { $from } = editor.state.selection
    if ($from.parent.type.name === 'characterCue') {
      const query = $from.parent.textContent
      setAcQuery(query)
      const coords = editor.view.coordsAtPos(editor.state.selection.from)
      setAcRect(new DOMRect(coords.left, coords.bottom + 4, 0, 0))
    } else {
      setAcRect(null)
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const content = JSON.stringify(editor.getJSON())
      await upsertDocument(projectId, 'scenario', content)
    }, 500)
  }, [editor, documentId, projectId])

  useEffect(() => {
    if (!editor) return
    editor.on('update', handleUpdate)
    editor.on('selectionUpdate', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
      editor.off('selectionUpdate', handleUpdate)
    }
  }, [editor, handleUpdate])

  async function handleSaveVersion() {
    if (!editor || !documentId) return
    setSaving(true)
    try {
      const content = JSON.stringify(editor.getJSON())
      await upsertDocument(projectId, 'scenario', content)
      await saveVersion(documentId, content)
      setSaveMsg('저장됨')
      setTimeout(() => setSaveMsg(''), 2000)
    } finally {
      setSaving(false)
    }
  }

  function handleRestore(content: string) {
    if (!editor) return
    try {
      editor.commands.setContent(JSON.parse(content))
    } catch {
      editor.commands.setContent(content)
    }
  }

  async function applySuggestion(name: string) {
    if (!editor) return
    editor.chain().focus().clearContent().insertContent(name).run()
    setAcRect(null)
    if (!characters.includes(name)) {
      await addCharacterIfMissing(projectId, name)
      setCharacters((prev) => [...prev, name].sort())
    }
  }

  async function handleAcEnter() {
    if (!editor) return
    const name = editor.state.selection.$from.parent.textContent.trim()
    if (!name) return
    setAcRect(null)
    await addCharacterIfMissing(projectId, name)
    if (!characters.includes(name)) {
      setCharacters((prev) => [...prev, name].sort())
    }
  }

  function scrollToScene(index: number) {
    if (!editor) return
    const headings = editor.view.dom.querySelectorAll('[data-type="scene-heading"]')
    headings[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveScene(index)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 툴바 */}
      <div className="no-print border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 flex items-center gap-1 flex-wrap">
        <button
          onClick={() => editor?.chain().focus().insertContent({ type: 'sceneHeading', content: [] }).run()}
          className="px-3 py-1.5 rounded text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          title="씬 추가 (#)"
        >
          + 씬
        </button>

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

        <FontSelector value={font} onChange={changeFont} />

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

        <button
          onClick={handleSaveVersion}
          disabled={saving || !documentId}
          className="p-2 rounded text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-40"
          title={saving ? '저장 중...' : saveMsg || '버전 저장'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v7M5 6l3 3 3-3"/>
            <path d="M2.5 11.5v1A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-1"/>
          </svg>
        </button>

        {documentId && (
          <VersionPanel contentId={documentId} contentType="document" onRestore={handleRestore} />
        )}

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

        {documentId && (
          <ShareButton contentId={documentId} contentType="document" />
        )}

        <DictionaryPanel />

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

        <button
          onClick={() => editor && exportMarkdown(editor, documentTitle || undefined)}
          disabled={!editor}
          className="px-3 py-1.5 rounded text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-40"
          title="마크다운으로 내보내기"
        >
          MD
        </button>
        <button
          onClick={exportPDF}
          className="px-3 py-1.5 rounded text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          title="PDF 인쇄"
        >
          PDF
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 에디터 본문 */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-8 py-12" style={{ fontFamily: currentFamily }}>
            <EditorContent editor={editor} className="tiptap" />
          </div>
        </div>

        {/* TOC 패널 */}
        {scenes.length > 0 && (
          <aside className="no-print hidden xl:flex flex-col w-48 border-l border-neutral-100 dark:border-neutral-800 flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">목차</p>
              <button
                onClick={() => setTocOpen((v) => !v)}
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 text-xs transition-colors"
                title={tocOpen ? '목차 접기' : '목차 펼치기'}
              >
                {tocOpen ? '−' : '+'}
              </button>
            </div>
            {tocOpen && (
              <nav className="flex-1 overflow-y-auto pb-6 px-4 flex flex-col gap-0.5">
                {scenes.map((s) => (
                  <button
                    key={s.index}
                    onClick={() => scrollToScene(s.index)}
                    className={`text-left px-1 py-1 rounded text-xs transition-colors ${
                      activeScene === s.index
                        ? 'text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
                        : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="font-mono text-[10px] mr-1 opacity-60">S#{s.index + 1}</span>
                    <span className="truncate block">{s.text}</span>
                  </button>
                ))}
              </nav>
            )}
          </aside>
        )}
      </div>

      {/* 캐릭터 자동완성 드롭다운 */}
      {acRect && (
        <div
          className="fixed z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-40"
          style={{ left: acRect.left, top: acRect.top }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {acSuggestions.length > 0 ? (
            acSuggestions.slice(0, 6).map((name) => (
              <button
                key={name}
                onClick={() => applySuggestion(name)}
                className="w-full text-left px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                {name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-neutral-400 dark:text-neutral-500">
              Enter로 새 인물 등록
            </div>
          )}
        </div>
      )}
    </div>
  )
}
