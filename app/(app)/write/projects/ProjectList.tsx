'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteProject, type Project } from '@/lib/projects'

export default function ProjectList({ projects: initial }: { projects: Project[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('이 작품을 삭제하시겠습니까?')) return
    setDeletingId(id)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-neutral-400 dark:text-neutral-500 mb-4">작성된 작품이 없습니다.</p>
        <Link
          href="/write/new"
          className="text-sm text-neutral-600 dark:text-neutral-400 underline"
        >
          새로 쓰기를 시작해보세요
        </Link>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {projects.map((project) => (
        <li
          key={project.id}
          className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 px-5 py-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
        >
          <Link
            href={`/write/${project.id}/scenario`}
            className="flex-1 min-w-0"
          >
            <p className="font-medium text-neutral-800 dark:text-neutral-100 truncate">{project.title}</p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
              {project.author && <span className="mr-3">{project.author}</span>}
              <span>
                {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
              </span>
            </p>
          </Link>
          <button
            onClick={() => handleDelete(project.id)}
            disabled={deletingId === project.id}
            className="ml-4 text-sm text-neutral-300 dark:text-neutral-600 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  )
}
