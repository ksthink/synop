export interface Project {
  id: string
  title: string
  writingDate: string
  createdAt: string
  updatedAt: string
  content: object | null
}

const KEY = 'synop_projects'

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function getProject(id: string): Project | null {
  return getProjects().find((p) => p.id === id) ?? null
}

export function createProject(title: string, writingDate: string): Project {
  const now = new Date().toISOString()
  const project: Project = {
    id: crypto.randomUUID(),
    title,
    writingDate,
    createdAt: now,
    updatedAt: now,
    content: null,
  }
  const projects = getProjects()
  localStorage.setItem(KEY, JSON.stringify([project, ...projects]))
  return project
}

export function updateProjectContent(id: string, content: object): void {
  const projects = getProjects().map((p) =>
    p.id === id ? { ...p, content, updatedAt: new Date().toISOString() } : p
  )
  localStorage.setItem(KEY, JSON.stringify(projects))
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id)
  localStorage.setItem(KEY, JSON.stringify(projects))
}
