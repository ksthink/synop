import { createClient } from './supabase/client'

export interface Version {
  id: string
  documentId: string
  content: string
  createdAt: string
}

interface VersionRow {
  id: string
  document_id: string
  content: string
  created_at: string
}

function toVersion(row: VersionRow): Version {
  return {
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    createdAt: row.created_at,
  }
}

export async function saveVersion(documentId: string, content: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('document_versions').insert({ document_id: documentId, content })
  // 7일 초과 버전 정리
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  await supabase
    .from('document_versions')
    .delete()
    .eq('document_id', documentId)
    .lt('created_at', cutoff)
}

export async function getVersions(documentId: string): Promise<Version[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as VersionRow[]).map(toVersion)
}

export async function restoreVersion(documentId: string, versionId: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('document_versions')
    .select('content')
    .eq('id', versionId)
    .eq('document_id', documentId)
    .single()
  if (error) throw error
  return (data as { content: string }).content
}

export async function saveJottingVersion(jottingId: string, content: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('jotting_versions').insert({ jotting_id: jottingId, content })
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  await supabase
    .from('jotting_versions')
    .delete()
    .eq('jotting_id', jottingId)
    .lt('created_at', cutoff)
}

export async function getJottingVersions(jottingId: string): Promise<Version[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jotting_versions')
    .select('*')
    .eq('jotting_id', jottingId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Array<{ id: string; jotting_id: string; content: string; created_at: string }>).map(
    (row) => ({ id: row.id, documentId: row.jotting_id, content: row.content, createdAt: row.created_at })
  )
}

export async function restoreJottingVersion(jottingId: string, versionId: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jotting_versions')
    .select('content')
    .eq('id', versionId)
    .eq('jotting_id', jottingId)
    .single()
  if (error) throw error
  return (data as { content: string }).content
}
