import { createClient } from './supabase/client'

export interface ShareLink {
  id: string
  contentType: 'document' | 'jotting'
  contentId: string
  token: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}

interface ShareLinkRow {
  id: string
  content_type: 'document' | 'jotting'
  content_id: string
  token: string
  expires_at: string
  is_active: boolean
  created_at: string
}

function toShareLink(row: ShareLinkRow): ShareLink {
  return {
    id: row.id,
    contentType: row.content_type,
    contentId: row.content_id,
    token: row.token,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

export async function createShareLink(
  contentType: 'document' | 'jotting',
  contentId: string,
  expiresAt: Date
): Promise<ShareLink> {
  const supabase = createClient()
  const token = crypto.randomUUID().replace(/-/g, '')
  const { data, error } = await supabase
    .from('share_links')
    .insert({
      content_type: contentType,
      content_id: contentId,
      token,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select()
    .single()
  if (error) throw error
  return toShareLink(data as ShareLinkRow)
}

export async function getShareLinkByContent(
  contentId: string
): Promise<ShareLink | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('content_id', contentId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return toShareLink(data as ShareLinkRow)
}

export async function getShareLink(token: string): Promise<ShareLink | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .single()
  if (error) return null
  return toShareLink(data as ShareLinkRow)
}

export async function deactivateShareLink(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('share_links').update({ is_active: false }).eq('id', id)
}
