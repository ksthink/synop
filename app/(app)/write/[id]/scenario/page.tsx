import { createClient } from '@/lib/supabase/server'
import { getDocument, upsertDocument } from '@/lib/documents'
import ScenarioPageClient from './ScenarioPageClient'

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  let doc = await getDocument(id, 'scenario', supabase)
  if (!doc) doc = await upsertDocument(id, 'scenario', '', supabase)

  return (
    <ScenarioPageClient
      projectId={id}
      initialDoc={{ id: doc.id, content: doc.content }}
    />
  )
}
