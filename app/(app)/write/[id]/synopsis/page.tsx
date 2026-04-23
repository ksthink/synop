'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getDocument, upsertDocument } from '@/lib/documents'
import FreeEditor from '@/components/editor/FreeEditor'

export default function SynopsisPage() {
  const params = useParams()
  const projectId = params.id as string

  const [documentId, setDocumentId] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    async function load() {
      let doc = await getDocument(projectId, 'synopsis')
      if (!doc) doc = await upsertDocument(projectId, 'synopsis', '')
      setDocumentId(doc.id)
      setContent(doc.content)
    }
    load()
  }, [projectId])

  const handleSave = useCallback(async (c: string) => {
    await upsertDocument(projectId, 'synopsis', c)
  }, [projectId])

  if (!documentId) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-neutral-400">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <FreeEditor
        content={content}
        onSave={handleSave}
        documentId={documentId}
        contentType="document"
      />
    </div>
  )
}
