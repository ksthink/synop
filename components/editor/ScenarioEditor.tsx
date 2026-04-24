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
import FontSelector from './FontSelector'
import DictionaryPanel from './DictionaryPanel'

import { getDocument, upsertDocument, updateDocument } from '@/lib/documents'
import { getCharacterNames } from '@/lib/characters'
import { exportMarkdown, exportPDF } from '@/lib/export'
import { useEditorFont } from '@/hooks/useEditorFont'

interface Props {
  projectId: string
  initialDoc?: { id: string; content: string }
}

type SaveStatus = 'saved' | 'unsaved' | 'error'

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
  const [charCount, setCharCount] = useState(0)
  const [activeScene, setActiveScene] = useState<number>(-1)
  const [tocOpen, setTocOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [isOffline, setIsOffline] = useState(false)
  const [showNetworkWarning, setShowNetworkWarning] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const charactersRef = useRef<string[]>([])
  const exportBtnRef = useRef<HTMLButtonElement>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportPos, setExportPos] = useState({ top: 0, left: 0 })
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const lastScrollY = useRef(0)
  const { font, changeFont, currentFamily } = useEditorFont()

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
      CharacterCue,
      Dialogue,
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

  // 초기 콘텐츠 로드
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

  // 캐릭터 목록
  useEffect(() => {
    getCharacterNames(projectId).then((names) => {
      charactersRef.current = names
    })
  }, [projectId])

  // 내보내기 드롭다운 외부 클릭 닫기
  useEffect(() => {
    if (!exportOpen) return
    const close = () => setExportOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [exportOpen])

  // 온/오프라인 감지
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      setSaveStatus('error')
      setShowNetworkWarning(true)
    }
    const handleOnline = () => {
      setIsOffline(false)
      setShowNetworkWarning(false)
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  const handleUpdate = useCallback(() => {
    if (!editor || !documentId) return

    const json = editor.getJSON()
    setScenes(extractScenes(json))
    setCharCount(editor.state.doc.textContent.length)
    setSaveStatus('unsaved')

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const content = JSON.stringify(json)
        await updateDocument(documentId, content)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
        if (!navigator.onLine) setShowNetworkWarning(true)
      }
    }, 500)
  }, [editor, documentId])

  useEffect(() => {
    if (!editor) return
    editor.on('update', handleUpdate)
    return () => { editor.off('update', handleUpdate) }
  }, [editor, handleUpdate])

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
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 툴바 — 스크롤 다운 시 숨김 */}
      <div className={`no-print grid transition-[grid-template-rows] duration-200 flex-shrink-0 ${toolbarVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-2 sm:px-4 py-2 flex items-center gap-1">
        {/* 좌측 — 스크롤 가능 */}
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => editor?.chain().focus().insertContent({ type: 'sceneHeading', content: [] }).run()}
            className="px-3 py-1.5 rounded text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors flex-shrink-0"
          >
            + 씬
          </button>

          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1 flex-shrink-0" />

          <FontSelector value={font} onChange={changeFont} />
        </div>

        {/* 우측 — 고정 */}
        <div className="flex items-center gap-1 flex-shrink-0 pl-2 border-l border-neutral-200 dark:border-neutral-700">
          {documentId && (
            <ShareButton contentId={documentId} contentType="document" />
          )}

          {/* 내보내기 드롭다운 */}
          <button
            ref={exportBtnRef}
            onClick={() => {
              if (!exportOpen && exportBtnRef.current) {
                const r = exportBtnRef.current.getBoundingClientRect()
                setExportPos({ top: r.bottom + 4, left: r.left })
              }
              setExportOpen((v) => !v)
            }}
            className="px-3 py-1.5 rounded text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            내보내기
          </button>

          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

          <DictionaryPanel />
          {scenes.length > 0 && (
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
          )}
        </div>
      </div>
      </div>
      </div>

      {/* 내보내기 드롭다운 패널 */}
      {exportOpen && (
        <div
          className="fixed z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-32"
          style={{ top: exportPos.top, left: exportPos.left }}
          onMouseDown={(e) => e.nativeEvent.stopPropagation()}
        >
          <button
            onClick={() => { editor && exportMarkdown(editor, documentTitle || undefined); setExportOpen(false) }}
            disabled={!editor}
            className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
          >
            .md
          </button>
          <button
            onClick={() => { exportPDF(); setExportOpen(false) }}
            className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            .pdf
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 에디터 본문 */}
        <div
          className="flex-1 overflow-y-auto"
          onScroll={(e) => {
            const current = e.currentTarget.scrollTop
            const delta = current - lastScrollY.current
            if (Math.abs(delta) > 4) setToolbarVisible(delta < 0 || current < 10)
            lastScrollY.current = current
          }}
        >
          <div className="mx-auto max-w-2xl px-4 sm:px-8 py-8 sm:py-12 pb-16" style={{ fontFamily: currentFamily }}>
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

      {/* 하단 통계바 — 브라우저 바닥 고정 */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 sm:px-8 py-1.5 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
        <span
          title={saveStatus === 'saved' ? '저장됨' : saveStatus === 'error' ? '저장 실패' : '저장 중...'}
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
            saveStatus === 'saved' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="mx-1 text-neutral-200 dark:text-neutral-700">|</span>
        <span>씬 {scenes.length}</span>
        <span className="mx-1 text-neutral-200 dark:text-neutral-700">|</span>
        <span>글자 {charCount.toLocaleString()}</span>
        <span className="mx-1 text-neutral-200 dark:text-neutral-700">|</span>
      </div>

      {/* 네트워크 불안정 팝업 */}
      {showNetworkWarning && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-900 rounded-xl shadow-xl px-4 py-3 text-sm max-w-sm w-[calc(100%-2rem)]">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
          <span className="text-neutral-700 dark:text-neutral-200 flex-1">
            네트워크 연결이 불안정합니다. 내용이 저장되지 않을 수 있습니다.
          </span>
          <button
            onClick={() => setShowNetworkWarning(false)}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-lg leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
