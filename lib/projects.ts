import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from './supabase/client'

export interface Project {
  id: string
  userId: string
  title: string
  author: string | null
  startedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ProjectRow {
  id: string
  user_id: string
  title: string
  author: string | null
  started_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateProjectInput {
  title: string
  author?: string | null
  startedAt?: string | null
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    author: row.author,
    startedAt: row.started_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function client(supabase?: SupabaseClient) {
  return supabase ?? createBrowserClient()
}

export async function getProjects(userId: string, supabase?: SupabaseClient): Promise<Project[]> {
  const { data, error } = await client(supabase)
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as ProjectRow[]).map(toProject)
}

export async function getProject(id: string, supabase?: SupabaseClient): Promise<Project | null> {
  const { data, error } = await client(supabase)
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return toProject(data as ProjectRow)
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
  supabase?: SupabaseClient
): Promise<Project> {
  const { data, error } = await client(supabase)
    .from('projects')
    .insert({
      user_id: userId,
      title: input.title,
      author: input.author ?? null,
      started_at: input.startedAt ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return toProject(data as ProjectRow)
}

export async function deleteProject(id: string, supabase?: SupabaseClient): Promise<void> {
  const { error } = await client(supabase).from('projects').delete().eq('id', id)
  if (error) throw error
}
