import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/lib/projects'
import ProjectHeader from './ProjectHeader'

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
      <ProjectHeader projectId={id} title={project.title} />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  )
}
