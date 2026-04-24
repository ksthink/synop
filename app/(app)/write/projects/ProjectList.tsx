'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteProject, type Project } from '@/lib/projects'

export interface ProjectStats {
  documentCreatedAt: string | null
  documentUpdatedAt: string | null
  sceneCount: number
  charCount: number
}

function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function ProjectList({
  projects: initial,
  statsMap,
}: {
  projects: Project[]
  statsMap: Record<string, ProjectStats>
}) {
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
        <Link href="/write/new" className="text-sm text-neutral-600 dark:text-neutral-400 underline">
          새로 쓰기를 시작해보세요
        </Link>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {projects.map((project) => {
        const stats = statsMap[project.id]
        return (
          <li
            key={project.id}
            className="flex items-start justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 sm:px-5 py-3 sm:py-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
          >
            <Link href={`/write/${project.id}`} className="flex-1 min-w-0">
              <p className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                {project.title}
              </p>

              {project.author && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {project.author}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                {stats ? (
                  <>
                    <Chip>씬 {stats.sceneCount}</Chip>
                    <Chip>{stats.charCount.toLocaleString()}자</Chip>
                    {stats.documentCreatedAt && (
                      <Chip>생성 {fmt(stats.documentCreatedAt)}</Chip>
                    )}
                    {stats.documentUpdatedAt && (
                      <Chip>수정 {fmt(stats.documentUpdatedAt)}</Chip>
                    )}
                  </>
                ) : (
                  <Chip>수정 {fmt(project.updatedAt)}</Chip>
                )}
              </div>
            </Link>

            <button
              onClick={() => handleDelete(project.id)}
              disabled={deletingId === project.id}
              className="ml-4 mt-0.5 text-sm text-neutral-300 dark:text-neutral-600 hover:text-red-400 transition-colors disabled:opacity-40 flex-shrink-0"
            >
              삭제
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-neutral-400 dark:text-neutral-500">
      {children}
    </span>
  )
}
