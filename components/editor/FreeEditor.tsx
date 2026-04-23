'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState, useCallback } from 'react'

import ShareButton from '@/components/share/ShareButton'
import VersionPanel from './VersionPanel'
import FontSelector from './FontSelector'
import DictionaryPanel from './DictionaryPanel'
import { saveVersion, saveJottingVersion } from '@/lib/versions'
import { useEditorFont } from '@/hooks/useEditorFont'

interface Props {
  content: string
  onSave: (content: string) => Promise<void>
  documentId: string
  contentType: 'document' | 'jotting'
}

function tryParse(s: string) {
  try { return JSON.parse(s) } catch { return s || '' }
}

export default function FreeEditor({ content, onSave, documentId, contentType }: Props) {
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { font, changeFont, currentFamily } = useEditorFont()

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
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await onSave(JSON.stringify(editor.getJSON()))
    }, 500)
  }, [editor, onSave])

  useEffect(() => {
    if (!editor) return
    editor.on('update', handleUpdate)
    return () => { editor.off('update', handleUpdate) }
  }, [editor, handleUpdate])

  async function handleSaveVersion() {
    if (!editor) return
    setSaving(true)
    try {
      const c = JSON.stringify(editor.getJSON())
      await onSave(c)
      if (contentType === 'jotting') {
        await saveJottingVersion(documentId, c)
      } else {
        await saveVersion(documentId, c)
      }
      setSaveMsg('저장됨')
      setTimeout(() => setSaveMsg(''), 2000)
    } finally {
      setSaving(false)
    }
  }

  function handleRestore(c: string) {
    if (!editor) return
    try { editor.commands.setContent(JSON.parse(c)) }
    catch { editor.commands.setContent(c) }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 flex items-center gap-1 flex-wrap">
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

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

        <FontSelector value={font} onChange={changeFont} />

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

        <button
          onClick={handleSaveVersion}
          disabled={saving}
          className="px-3 py-1.5 rounded text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-40"
        >
          {saving ? '저장 중...' : saveMsg || '버전 저장'}
        </button>

        <VersionPanel contentId={documentId} contentType={contentType} onRestore={handleRestore} />

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

        <ShareButton contentId={documentId} contentType={contentType} />

        <DictionaryPanel />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-12" style={{ fontFamily: currentFamily }}>
          <EditorContent editor={editor} className="tiptap" />
        </div>
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
      className={`w-8 h-7 rounded text-sm transition-colors ${
        active
          ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200'
      }`}
    >
      {children}
    </button>
  )
}
