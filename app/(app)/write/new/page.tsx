'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createProject } from '@/lib/projects'
import { createClient } from '@/lib/supabase/client'

export default function NewProjectPage() {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [startedAt, setStartedAt] = useState(today)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')
      const project = await createProject(
        user.id,
        { title: title.trim(), author: author.trim() || null, startedAt }
      )
      router.push(`/write/${project.id}`)
    } catch {
      setError('프로젝트 생성에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <Link
          href="/write"
          className="inline-block mb-10 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          ← 뒤로
        </Link>

        <h2 className="text-xl font-semibold text-neutral-800 mb-8">새 작품</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500">
              작품명 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              autoFocus
              required
              className="border-b border-neutral-300 bg-transparent py-2 text-neutral-800 placeholder-neutral-300 outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500">작가명</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="작가 이름 (선택)"
              className="border-b border-neutral-300 bg-transparent py-2 text-neutral-800 placeholder-neutral-300 outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500">집필일</label>
            <input
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="border-b border-neutral-300 bg-transparent py-2 text-neutral-800 outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="mt-2 py-3 rounded-lg bg-neutral-800 text-white text-sm font-medium disabled:opacity-40 hover:bg-neutral-700 transition-colors"
          >
            {loading ? '생성 중...' : '집필 시작'}
          </button>
        </form>
      </div>
    </div>
  )
}
