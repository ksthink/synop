import { createClient } from '@/lib/supabase/server'
import { getDocument, upsertDocument } from '@/lib/documents'
import DocumentEditor from '../DocumentEditor'

export default async function IntentionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  let doc = await getDocument(id, 'intention', supabase)
  if (!doc) doc = await upsertDocument(id, 'intention', '', supabase)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DocumentEditor documentId={doc.id} initialContent={doc.content} />
    </div>
  )
}
