'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects, type Project } from '@/lib/projects'

export default function RecentProjects() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const all = getProjects()
    const sorted = [...all].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    setProjects(sorted.slice(0, 3))
  }, [])

  if (projects.length === 0) return null

  return (
    <div className="w-full max-w-xl mt-12">
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3 tracking-wide">
        최근 작품
      </p>
      <ul className="flex flex-col gap-2">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={`/write/${project.id}`}
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
            >
              <span className="font-medium text-sm text-neutral-700 dark:text-neutral-200 truncate">
                {project.title}
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-4 shrink-0">
                {formatDate(project.updatedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
