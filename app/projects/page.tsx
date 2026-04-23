'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getProjects, deleteProject, type Project } from '@/lib/projects'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    setProjects(getProjects())
  }, [])

  function handleDelete(id: string) {
    deleteProject(id)
    setProjects(getProjects())
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 px-6 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            ← 뒤로
          </Link>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            목록
          </h2>
          <div className="w-10" />
        </div>

        {projects.length === 0 ? (
          <p className="text-center text-neutral-400 dark:text-neutral-600 py-20 text-sm">
            저장된 작품이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {projects.map((project) => (
              <li key={project.id}>
                <div className="flex items-center gap-3 px-4 py-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors group">
                  <Link
                    href={`/write/${project.id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                      {project.title}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {project.writingDate} · 수정 {formatDate(project.updatedAt)}
                    </p>
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 dark:text-neutral-600 dark:hover:text-red-500 transition-all text-lg leading-none"
                    title="삭제"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
