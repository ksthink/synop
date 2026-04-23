import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from './supabase/client'

export interface Character {
  id: string
  projectId: string
  name: string
  gender: string | null
  age: number | null
  job: string | null
  summary: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCharacterInput {
  name: string
  gender?: string | null
  age?: number | null
  job?: string | null
  summary?: string | null
  description?: string | null
}

interface CharacterRow {
  id: string
  project_id: string
  name: string
  gender: string | null
  age: number | null
  job: string | null
  summary: string | null
  description: string | null
  created_at: string
  updated_at: string
}

function toCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    gender: row.gender,
    age: row.age,
    job: row.job,
    summary: row.summary,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function client(supabase?: SupabaseClient) {
  return supabase ?? createBrowserClient()
}

export function isIncomplete(c: Character): boolean {
  return !c.gender && c.age == null && !c.job && !c.summary && !c.description
}

export async function getCharacters(
  projectId: string,
  supabase?: SupabaseClient
): Promise<Character[]> {
  const { data, error } = await client(supabase)
    .from('characters')
    .select('*')
    .eq('project_id', projectId)
    .order('name')
  if (error) throw error
  return (data as CharacterRow[]).map(toCharacter)
}

export async function getCharacter(
  id: string,
  supabase?: SupabaseClient
): Promise<Character | null> {
  const { data, error } = await client(supabase)
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return toCharacter(data as CharacterRow)
}

export async function createCharacter(
  projectId: string,
  input: CreateCharacterInput,
  supabase?: SupabaseClient
): Promise<Character> {
  const { data, error } = await client(supabase)
    .from('characters')
    .insert({
      project_id: projectId,
      name: input.name,
      gender: input.gender ?? null,
      age: input.age ?? null,
      job: input.job ?? null,
      summary: input.summary ?? null,
      description: input.description ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return toCharacter(data as CharacterRow)
}

export async function updateCharacter(
  id: string,
  input: Partial<CreateCharacterInput>,
  supabase?: SupabaseClient
): Promise<Character> {
  const { data, error } = await client(supabase)
    .from('characters')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.gender !== undefined && { gender: input.gender }),
      ...(input.age !== undefined && { age: input.age }),
      ...(input.job !== undefined && { job: input.job }),
      ...(input.summary !== undefined && { summary: input.summary }),
      ...(input.description !== undefined && { description: input.description }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toCharacter(data as CharacterRow)
}

export async function deleteCharacter(
  id: string,
  supabase?: SupabaseClient
): Promise<void> {
  const { error } = await client(supabase).from('characters').delete().eq('id', id)
  if (error) throw error
}

export async function getCharacterNames(projectId: string): Promise<string[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('characters')
    .select('name')
    .eq('project_id', projectId)
    .order('name')
  if (error) return []
  return (data as { name: string }[]).map((c) => c.name)
}

export async function addCharacterIfMissing(
  projectId: string,
  name: string
): Promise<void> {
  const supabase = createBrowserClient()
  const { data } = await supabase
    .from('characters')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', name)
    .single()
  if (!data) {
    await supabase.from('characters').insert({ project_id: projectId, name })
  }
}
