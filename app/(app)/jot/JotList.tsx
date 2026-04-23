'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteJotting, type Jotting } from '@/lib/jottings'

export default function JotList({ jottings: initial }: { jottings: Jotting[] }) {
  const [jottings, setJottings] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('이 끄적을 삭제하시겠습니까?')) return
    setDeletingId(id)
    try {
      await deleteJotting(id)
      setJottings((prev) => prev.filter((j) => j.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  if (jottings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-neutral-400 dark:text-neutral-500">작성된 끄적이 없습니다.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {jottings.map((jotting) => (
        <li
          key={jotting.id}
          className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 px-5 py-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
        >
          <Link href={`/jot/${jotting.id}`} className="flex-1 min-w-0">
            <p className="font-medium text-neutral-800 dark:text-neutral-100 truncate">{jotting.title}</p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
              {new Date(jotting.updatedAt).toLocaleDateString('ko-KR')}
            </p>
          </Link>
          <button
            onClick={() => handleDelete(jotting.id)}
            disabled={deletingId === jotting.id}
            className="ml-4 text-sm text-neutral-300 dark:text-neutral-600 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  )
}
