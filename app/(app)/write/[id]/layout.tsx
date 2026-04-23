import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/lib/projects'
import ProjectNav from './ProjectNav'
import ThemeToggle from '@/components/ThemeToggle'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const project = await getProject(id, supabase)
  if (!project) notFound()

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-900">
      <header className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-3 flex items-center gap-4">
        <Link
          href="/write/projects"
          className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          ←
        </Link>
        <span className="font-medium text-neutral-800 dark:text-neutral-100 truncate max-w-xs">
          {project.title}
        </span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <ProjectNav projectId={id} />

      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  )
}
