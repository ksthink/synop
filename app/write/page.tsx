'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createProject } from '@/lib/projects'

export default function NewProjectPage() {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState('')
  const [writingDate, setWritingDate] = useState(today)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const project = createProject(title.trim(), writingDate)
    router.push(`/write/${project.id}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900 px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-block mb-10 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          ← 뒤로
        </Link>

        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-8">
          새 작품
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-neutral-500 dark:text-neutral-400">
              작품 이름
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              autoFocus
              className="w-full border-b border-neutral-300 dark:border-neutral-600 bg-transparent py-2 text-neutral-800 dark:text-neutral-100 placeholder-neutral-300 dark:placeholder-neutral-600 outline-none focus:border-neutral-600 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-neutral-500 dark:text-neutral-400">
              집필 시점
            </label>
            <input
              type="date"
              value={writingDate}
              onChange={(e) => setWritingDate(e.target.value)}
              className="w-full border-b border-neutral-300 dark:border-neutral-600 bg-transparent py-2 text-neutral-800 dark:text-neutral-100 outline-none focus:border-neutral-600 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="mt-2 py-3 rounded-lg bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-sm disabled:opacity-30 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
          >
            집필 시작
          </button>
        </form>
      </div>
    </div>
  )
}
