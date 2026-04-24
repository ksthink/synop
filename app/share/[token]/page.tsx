import { createClient } from '@/lib/supabase/server'
import type { JSONContent } from '@tiptap/core'

interface ShareRow {
  id: string
  content_type: string
  content_id: string
  token: string
  expires_at: string
  is_active: boolean
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .single()

  if (!link) return <ErrorView message="존재하지 않는 링크입니다." />

  const row = link as ShareRow

  if (!row.is_active || new Date(row.expires_at) < new Date()) {
    return <ErrorView message="만료된 링크입니다." />
  }

  let title: string | undefined
  let contentType: string
  let rawContent: string

  if (row.content_type === 'jotting') {
    const { data: jot } = await supabase
      .from('jottings')
      .select('title, content')
      .eq('id', row.content_id)
      .single()

    if (!jot) return <ErrorView message="문서를 찾을 수 없습니다." />
    title = (jot as { title: string; content: string }).title
    rawContent = (jot as { title: string; content: string }).content
    contentType = 'jotting'
  } else {
    const { data: doc } = await supabase
      .from('documents')
      .select('type, content')
      .eq('id', row.content_id)
      .single()

    if (!doc) return <ErrorView message="문서를 찾을 수 없습니다." />
    contentType = (doc as { type: string; content: string }).type
    rawContent = (doc as { type: string; content: string }).content
  }

  let parsed: JSONContent | null = null
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    // plain text fallback
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto px-8 py-12">
        {title && (
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">{title}</h1>
        )}

        {contentType === 'scenario' && parsed ? (
          <ScenarioView doc={parsed} />
        ) : parsed ? (
          <FreeView doc={parsed} />
        ) : (
          <div className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
            {rawContent}
          </div>
        )}

        <footer className="mt-16 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-300 dark:text-neutral-600">
          <span className="font-semibold tracking-widest">SYNOP</span>에서 작성됨
        </footer>
      </div>
    </div>
  )
}

function ScenarioView({ doc }: { doc: JSONContent }) {
  const nodes = doc.content ?? []

  return (
    <div className="scenario-viewer">
      {nodes.map((node, i) => {
        const text = (node.content ?? [])
          .map((n) => n.text ?? '')
          .join('')

        switch (node.type) {
          case 'sceneHeading':
            return (
              <h2 key={i} className="scene-heading text-neutral-800 dark:text-neutral-100">
                {text}
              </h2>
            )
          case 'characterCue':
            return (
              <p key={i} className="character-cue text-neutral-800 dark:text-neutral-100">
                {text}
              </p>
            )
          case 'dialogue':
            return (
              <p key={i} className="dialogue text-neutral-700 dark:text-neutral-300">
                {text}
              </p>
            )
          case 'stageDirection':
            return (
              <p key={i} className="stage-direction">
                {text}
              </p>
            )
          case 'speechLine': {
            const character = node.attrs?.character ?? ''
            const dialogueNodes = node.content ?? []
            const dialogue = dialogueNodes.map((n, j) => {
              if (n.type === 'hardBreak') return <br key={j} />
              return <span key={j}>{n.text ?? ''}</span>
            })
            return (
              <div key={i} className="speech-line" style={{ display: 'flex', gap: '1.5em', margin: '1.2em 0 0' }}>
                <span style={{ minWidth: '7em', flexShrink: 0, fontWeight: 700, color: '#4a4a4a', letterSpacing: '0.04em' }}>
                  {character}
                </span>
                <span style={{ flex: 1 }}>{dialogue}</span>
              </div>
            )
          }
          default:
            return text ? (
              <p key={i} className="mb-3 text-neutral-800 dark:text-neutral-200">
                {text}
              </p>
            ) : (
              <br key={i} />
            )
        }
      })}
    </div>
  )
}

function renderInlineNodes(nodes: JSONContent[]): React.ReactNode {
  return nodes.map((node, i) => {
    if (node.type === 'hardBreak') return <br key={i} />
    if (node.type !== 'text') return null
    const text = node.text ?? ''
    const marks = node.marks ?? []
    const isBold = marks.some((m) => m.type === 'bold')
    const isItalic = marks.some((m) => m.type === 'italic')
    if (isBold && isItalic) return <strong key={i}><em>{text}</em></strong>
    if (isBold) return <strong key={i}>{text}</strong>
    if (isItalic) return <em key={i}>{text}</em>
    return <span key={i}>{text}</span>
  })
}

function renderBlockNode(node: JSONContent, i: number): React.ReactNode {
  const children = node.content ?? []
  switch (node.type) {
    case 'paragraph': {
      const inline = renderInlineNodes(children)
      const isEmpty = children.length === 0 || children.every((n) => !n.text)
      return isEmpty ? <br key={i} /> : (
        <p key={i} className="mb-3 text-neutral-800 dark:text-neutral-200 leading-relaxed">{inline}</p>
      )
    }
    case 'heading': {
      const level = node.attrs?.level ?? 2
      const inline = renderInlineNodes(children)
      if (level === 2) return <h2 key={i} className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mt-6 mb-2">{inline}</h2>
      return <h3 key={i} className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mt-4 mb-2">{inline}</h3>
    }
    case 'bulletList':
      return (
        <ul key={i} className="list-disc pl-6 mb-3 text-neutral-800 dark:text-neutral-200">
          {children.map((c, j) => renderBlockNode(c, j))}
        </ul>
      )
    case 'listItem':
      return <li key={i} className="mb-1">{children.map((c, j) => renderBlockNode(c, j))}</li>
    default:
      return null
  }
}

function FreeView({ doc }: { doc: JSONContent }) {
  const nodes = doc.content ?? []
  return <div>{nodes.map((node, i) => renderBlockNode(node, i))}</div>
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900">
      <h1 className="text-xl font-semibold tracking-widest text-neutral-800 dark:text-neutral-100 mb-4">
        SYNOP
      </h1>
      <p className="text-sm text-neutral-400 dark:text-neutral-500">{message}</p>
    </div>
  )
}
