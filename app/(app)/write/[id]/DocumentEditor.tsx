'use client'

import { useCallback } from 'react'
import FreeEditor from '@/components/editor/FreeEditor'
import { updateDocument } from '@/lib/documents'

interface Props {
  documentId: string
  initialContent: string
  title?: string
}

export default function DocumentEditor({ documentId, initialContent, title }: Props) {
  const handleSave = useCallback(async (content: string) => {
    await updateDocument(documentId, content)
  }, [documentId])

  return (
    <FreeEditor
      content={initialContent}
      onSave={handleSave}
      documentId={documentId}
      contentType="document"
      title={title}
    />
  )
}
