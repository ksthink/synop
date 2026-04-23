import { createClient } from '@/lib/supabase/server'
import { getDocument, upsertDocument } from '@/lib/documents'
import { getProject } from '@/lib/projects'
import DocumentEditor from '../DocumentEditor'

export default async function IntentionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const [project, doc] = await Promise.all([
    getProject(id, supabase),
    getDocument(id, 'intention', supabase).then((d) =>
      d ?? upsertDocument(id, 'intention', '', supabase)
    ),
  ])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DocumentEditor documentId={doc.id} initialContent={doc.content} title={project?.title} />
    </div>
  )
}
