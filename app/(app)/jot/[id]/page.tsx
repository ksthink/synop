import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getJotting } from '@/lib/jottings'
import JotEditorClient from './JotEditorClient'

export default async function JotEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const jotting = await getJotting(id, supabase)
  if (!jotting) notFound()

  return <JotEditorClient jotting={jotting} />
}
