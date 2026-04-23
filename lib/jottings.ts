import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from './supabase/client'

export interface Jotting {
  id: string
  userId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface JottingRow {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

function toJotting(row: JottingRow): Jotting {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function client(supabase?: SupabaseClient) {
  return supabase ?? createBrowserClient()
}

export async function getJottings(userId: string, supabase?: SupabaseClient): Promise<Jotting[]> {
  const { data, error } = await client(supabase)
    .from('jottings')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as JottingRow[]).map(toJotting)
}

export async function getJotting(id: string, supabase?: SupabaseClient): Promise<Jotting | null> {
  const { data, error } = await client(supabase)
    .from('jottings')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return toJotting(data as JottingRow)
}

export async function createJotting(userId: string, supabase?: SupabaseClient): Promise<Jotting> {
  const { data, error } = await client(supabase)
    .from('jottings')
    .insert({ user_id: userId, title: '제목 없음', content: '' })
    .select()
    .single()
  if (error) throw error
  return toJotting(data as JottingRow)
}

export async function updateJotting(
  id: string,
  input: Partial<Pick<Jotting, 'title' | 'content'>>,
  supabase?: SupabaseClient
): Promise<Jotting> {
  const { data, error } = await client(supabase)
    .from('jottings')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toJotting(data as JottingRow)
}

export async function deleteJotting(id: string, supabase?: SupabaseClient): Promise<void> {
  const { error } = await client(supabase).from('jottings').delete().eq('id', id)
  if (error) throw error
}
