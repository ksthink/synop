'use client'

import { Editor } from '@tiptap/react'
import { exportMarkdown, exportPDF } from '@/lib/export'

interface Props {
  editor: Editor | null
  onBack?: () => void
  focusMode?: boolean
  onToggleFocusMode?: () => void
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-neutral-200 dark:bg-neutral-600 text-neutral-900 dark:text-white'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-600 mx-1" />
}

export default function Toolbar({ editor, onBack, focusMode, onToggleFocusMode }: Props) {
  if (!editor) return null

  function toggle(type: string) {
    if (!editor) return
    const chain = editor.chain().focus()
    if (editor.isActive(type)) {
      chain.setNode('paragraph').run()
    } else {
      chain.setNode(type).run()
    }
  }

  return (
    <div className="no-print flex items-center gap-0.5 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 sticky top-0 z-10">
      {onBack && (
        <>
          <ToolButton onClick={onBack} title="뒤로">←</ToolButton>
          <Divider />
        </>
      )}

      <ToolButton
        active={editor.isActive('slugline')}
        onClick={() => toggle('slugline')}
        title="씬 제목 @ 또는 ##"
      >
        S#
      </ToolButton>

      <ToolButton
        active={editor.isActive('character')}
        onClick={() => toggle('character')}
        title="인물 [이름]"
      >
        [ ]
      </ToolButton>

      <ToolButton
        active={editor.isActive('dialogue')}
        onClick={() => toggle('dialogue')}
        title="대사"
      >
        &#8220;&#8221;
      </ToolButton>

      <ToolButton
        active={editor.isActive('stageDirection')}
        onClick={() => toggle('stageDirection')}
        title="지문 (Cmd+Shift+D)"
      >
        ( )
      </ToolButton>

      <ToolButton
        active={editor.isActive('transition')}
        onClick={() => toggle('transition')}
        title="장면 전환 >>"
      >
        CUT
      </ToolButton>

      <Divider />

      <ToolButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="볼드 (Cmd+B)"
      >
        <strong>B</strong>
      </ToolButton>

      <ToolButton
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="인용"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 17h3l2-4V7h-6v6h3M6 17h3l2-4V7H5v6h3l-2 4z" />
        </svg>
      </ToolButton>

      <Divider />

      {onToggleFocusMode && (
        <ToolButton
          active={focusMode}
          onClick={onToggleFocusMode}
          title="포커스 모드"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </ToolButton>
      )}

      <Divider />

      <ToolButton onClick={() => exportMarkdown(editor)} title=".md 내보내기">
        .md
      </ToolButton>
      <ToolButton onClick={exportPDF} title="PDF 내보내기">
        PDF
      </ToolButton>
    </div>
  )
}
