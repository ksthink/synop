'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { JSONContent } from '@tiptap/core'

import { SceneHeading } from './extensions/SceneHeading'
import { CharacterCue } from './extensions/CharacterCue'
import { Dialogue } from './extensions/Dialogue'
import { StageDirection } from './extensions/StageDirection'
import { createSpeechLine } from './extensions/SpeechLine'
import { createCharacterInput } from './extensions/CharacterInput'

import ShareButton from '@/components/share/ShareButton'
import VersionPanel from './VersionPanel'
import FontSelector from './FontSelector'
import DictionaryPanel from './DictionaryPanel'

import { getDocument, upsertDocument, updateDocument } from '@/lib/documents'
import { saveVersion } from '@/lib/versions'
import { getCharacterNames } from '@/lib/characters'
import { exportMarkdown, exportPDF } from '@/lib/export'
import { useEditorFont } from '@/hooks/useEditorFont'

interface Props {
  projectId: string
  initialDoc?: { id: string; content: string }
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

export default function ScenarioEditor({ projectId, initialDoc }: Props) {
  const [documentId, setDocumentId] = useState<string | null>(initialDoc?.id ?? null)
  const [documentTitle, setDocumentTitle] = useState('')
  const [scenes, setScenes] = useState<{ text: string; index: number }[]>([])
  const [activeScene, setActiveScene] = useState<number>(-1)
  const [tocOpen, setTocOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const charactersRef = useRef<string[]>([])
  const { font, changeFont, currentFamily } = useEditorFont()

  // stable extensions created once; read charactersRef at call time
  const SpeechLineExt = useMemo(() => createSpeechLine(), [])
  const CharacterInputExt = useMemo(() => createCharacterInput(charactersRef), [])

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
      CharacterCue,      // kept for backward compat with existing docs
      Dialogue,          // kept for backward compat with existing docs
      StageDirection,
      CharacterInputExt,
      SpeechLineExt,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'sceneHeading') return '장소 (시간)'
          if (node.type.name === 'characterCue') return '인물명'
          if (node.type.name === 'characterInput') return '인물명'
          if (node.type.name === 'speechLine') return ''
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
    if (initialDoc) {
      if (initialDoc.content) {
        try { editor.commands.setContent(JSON.parse(initialDoc.content)) } catch {}
      }
      return
    }
    ;(async () => {
      let doc = await getDocument(projectId, 'scenario')
      if (!doc) doc = await upsertDocument(projectId, 'scenario', '')
      setDocumentId(doc.id)
      if (doc.content) {
        try { editor.commands.setContent(JSON.parse(doc.content)) } catch {}
      }
    })()
  }, [editor, projectId])

  useEffect(() => {
    getCharacterNames(projectId).then((names) => {
      charactersRef.current = names
    })
  }, [projectId])

  const handleUpdate = useCallback(() => {
    if (!editor || !documentId) return
    setScenes(extractScenes(editor.getJSON()))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const content = JSON.stringify(editor.getJSON())
      await updateDocument(documentId, content)
    }, 500)
  }, [editor, documentId])

  useEffect(() => {
    if (!editor) return
    editor.on('update', handleUpdate)
    return () => { editor.off('update', handleUpdate) }
  }, [editor, handleUpdate])

  async function handleSaveVersion() {
    if (!editor || !documentId) return
    setSaving(true)
    try {
      const content = JSON.stringify(editor.getJSON())
      await updateDocument(documentId, content)
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

  function scrollToScene(index: number) {
    if (!editor) return
    const headings = editor.view.dom.querySelectorAll('[data-type="scene-heading"]')
    headings[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveScene(index)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 툴바 */}
      <div className="no-print border-b border-neutral-200 dark:border-neutral-800 px-2 sm:px-4 py-2 flex items-center gap-1 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
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

        {scenes.length > 0 && (
          <>
            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />
            <button
              onClick={() => setTocOpen((v) => !v)}
              className={`hidden xl:block px-3 py-1.5 rounded text-sm transition-colors ${
                tocOpen
                  ? 'text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              목차
            </button>
          </>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 에디터 본문 */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 sm:px-8 py-8 sm:py-12" style={{ fontFamily: currentFamily }}>
            <EditorContent editor={editor} className="tiptap" />
          </div>
        </div>

        {/* TOC 패널 */}
        <aside
          className="no-print hidden xl:flex flex-col border-l border-neutral-100 dark:border-neutral-800 flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
          style={{ width: tocOpen ? '12rem' : '0' }}
        >
          <div className="w-48 flex flex-col flex-1 min-h-0">
            <div className="px-4 py-3 flex-shrink-0">
              <p className="text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">목차</p>
            </div>
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
          </div>
        </aside>
      </div>
    </div>
  )
}
