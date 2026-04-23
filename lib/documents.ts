import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from './supabase/client'

export type DocumentType = 'intention' | 'synopsis' | 'scenario'

export interface Document {
  id: string
  projectId: string
  type: DocumentType
  content: string
  createdAt: string
  updatedAt: string
}

interface DocumentRow {
  id: string
  project_id: string
  type: DocumentType
  content: string
  created_at: string
  updated_at: string
}

function toDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function client(supabase?: SupabaseClient) {
  return supabase ?? createBrowserClient()
}

export async function getDocument(
  projectId: string,
  type: DocumentType,
  supabase?: SupabaseClient
): Promise<Document | null> {
  const { data, error } = await client(supabase)
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('type', type)
    .single()
  if (error) return null
  return toDocument(data as DocumentRow)
}

export async function upsertDocument(
  projectId: string,
  type: DocumentType,
  content: string,
  supabase?: SupabaseClient
): Promise<Document> {
  const { data, error } = await client(supabase)
    .from('documents')
    .upsert(
      { project_id: projectId, type, content },
      { onConflict: 'project_id,type' }
    )
    .select()
    .single()
  if (error) throw error
  return toDocument(data as DocumentRow)
}

export async function updateDocument(
  id: string,
  content: string,
  supabase?: SupabaseClient
): Promise<void> {
  const { error } = await client(supabase)
    .from('documents')
    .update({ content })
    .eq('id', id)
  if (error) throw error
}
