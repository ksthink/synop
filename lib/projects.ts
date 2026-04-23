import { getSupabase } from './supabase'

export interface Project {
  id: string
  title: string
  writingDate: string
  createdAt: string
  updatedAt: string
  content: object | null
}

interface Row {
  id: string
  title: string
  writing_date: string
  created_at: string
  updated_at: string
  content: object | null
}

function toProject(row: Row): Project {
  return {
    id: row.id,
    title: row.title,
    writingDate: row.writing_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    content: row.content,
  }
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as Row[]).map(toProject)
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return toProject(data as Row)
}

export async function createProject(title: string, writingDate: string): Promise<Project> {
  const { data, error } = await getSupabase()
    .from('projects')
    .insert({ title, writing_date: writingDate })
    .select()
    .single()
  if (error) throw error
  return toProject(data as Row)
}

export async function updateProjectContent(id: string, content: object): Promise<void> {
  await getSupabase()
    .from('projects')
    .update({ content })
    .eq('id', id)
}

export async function deleteProject(id: string): Promise<void> {
  await getSupabase()
    .from('projects')
    .delete()
    .eq('id', id)
}
