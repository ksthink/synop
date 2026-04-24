'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState, useCallback } from 'react'

import ShareButton from '@/components/share/ShareButton'
import FontSelector from './FontSelector'
import DictionaryPanel from './DictionaryPanel'
import { useEditorFont } from '@/hooks/useEditorFont'
import { exportMarkdown, exportPDF } from '@/lib/export'

interface Props {
  content: string
  onSave: (content: string) => Promise<void>
  documentId: string
  contentType: 'document' | 'jotting'
  title?: string
}

type SaveStatus = 'saved' | 'unsaved' | 'error'

function tryParse(s: string) {
  try { return JSON.parse(s) } catch { return s || '' }
}

export default function FreeEditor({ content, onSave, documentId, contentType, title }: Props) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [charCount, setCharCount] = useState(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { font, changeFont, currentFamily } = useEditorFont()

  const exportBtnRef = useRef<HTMLButtonElement>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportPos, setExportPos] = useState({ top: 0, left: 0 })
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const lastScrollY = useRef(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        blockquote: false,
        orderedList: false,
      }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    content: tryParse(content),
    editorProps: { attributes: { class: 'outline-none' } },
    immediatelyRender: false,
  })

  const handleUpdate = useCallback(() => {
    if (!editor) return
    setSaveStatus('unsaved')
    setCharCount(editor.state.doc.textContent.length)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await onSave(JSON.stringify(editor.getJSON()))
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 500)
  }, [editor, onSave])

  useEffect(() => {
    if (!editor) return
    editor.on('update', handleUpdate)
    return () => { editor.off('update', handleUpdate) }
  }, [editor, handleUpdate])

  useEffect(() => {
    if (!exportOpen) return
    const close = () => setExportOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [exportOpen])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 툴바 — 스크롤 다운 시 숨김 */}
      <div className={`no-print grid transition-[grid-template-rows] duration-200 flex-shrink-0 ${toolbarVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-2 sm:px-4 py-2 flex items-center gap-1">
        {/* 좌측 — 스크롤 가능 */}
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <ToolBtn
            active={editor?.isActive('bold')}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title="굵게 (⌘B)"
          >
            <strong>B</strong>
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('italic')}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title="기울기 (⌘I)"
          >
            <em>I</em>
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('heading', { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('heading', { level: 3 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            title="목록"
          >
            ≡
          </ToolBtn>

          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1 flex-shrink-0" />

          <FontSelector value={font} onChange={changeFont} />
        </div>

        {/* 우측 — 고정 */}
        <div className="flex items-center gap-1 flex-shrink-0 pl-2 border-l border-neutral-200 dark:border-neutral-700">
          <ShareButton contentId={documentId} contentType={contentType} />

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
            onClick={() => { editor && exportMarkdown(editor, title); setExportOpen(false) }}
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

      {/* 하단 상태바 — 브라우저 바닥 고정 */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 sm:px-8 py-1.5 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
            saveStatus === 'saved' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="mx-1 text-neutral-200 dark:text-neutral-700">|</span>
        <span>글자 {charCount.toLocaleString()}</span>
        <span className="mx-1 text-neutral-200 dark:text-neutral-700">|</span>
      </div>
    </div>
  )
}

function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-7 rounded text-sm transition-colors flex-shrink-0 ${
        active
          ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200'
      }`}
    >
      {children}
    </button>
  )
}
