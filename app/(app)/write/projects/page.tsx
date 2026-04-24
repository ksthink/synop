import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProjects, type Project } from '@/lib/projects'
import { getScenarioDocs } from '@/lib/documents'
import ProjectList, { type ProjectStats } from './ProjectList'

function parseStats(content: string): { sceneCount: number; charCount: number } {
  try {
    const json = JSON.parse(content)
    let sceneCount = 0
    let charCount = 0
    function walk(node: { type?: string; text?: string; content?: typeof node[] }) {
      if (!node) return
      if (node.type === 'sceneHeading') sceneCount++
      if (node.type === 'text') charCount += (node.text ?? '').length
      for (const child of node.content ?? []) walk(child)
    }
    walk(json)
    return { sceneCount, charCount }
  } catch {
    return { sceneCount: 0, charCount: 0 }
  }
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let projects: Project[] = []
  let fetchError = ''
  try {
    projects = await getProjects(user.id, supabase)
  } catch {
    fetchError = '목록을 불러오는 데 실패했습니다.'
  }

  const statsMap: Record<string, ProjectStats> = {}
  if (projects.length > 0) {
    try {
      const docs = await getScenarioDocs(projects.map((p) => p.id), supabase)
      for (const doc of docs) {
        const { sceneCount, charCount } = parseStats(doc.content)
        statsMap[doc.projectId] = {
          documentCreatedAt: doc.createdAt,
          documentUpdatedAt: doc.updatedAt,
          sceneCount,
          charCount,
        }
      }
    } catch {}
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12 bg-white dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <Link
              href="/write"
              className="inline-block mb-2 text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              ← 뒤로
            </Link>
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">내 작품</h2>
          </div>
          <Link
            href="/write/new"
            className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm hover:bg-neutral-700 transition-colors"
          >
            새로 쓰기
          </Link>
        </div>

        {fetchError ? (
          <p className="text-sm text-red-500">{fetchError}</p>
        ) : (
          <ProjectList projects={projects} statsMap={statsMap} />
        )}
      </div>
    </div>
  )
}
