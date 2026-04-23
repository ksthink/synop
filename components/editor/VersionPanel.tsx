'use client'

import { useState } from 'react'
import {
  getVersions,
  restoreVersion,
  getJottingVersions,
  restoreJottingVersion,
  type Version,
} from '@/lib/versions'

interface Props {
  contentId: string
  contentType: 'document' | 'jotting'
  onRestore: (content: string) => void
}

export default function VersionPanel({ contentId, contentType, onRestore }: Props) {
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  async function handleOpen() {
    setOpen(true)
    setLoading(true)
    try {
      const list =
        contentType === 'jotting'
          ? await getJottingVersions(contentId)
          : await getVersions(contentId)
      setVersions(list)
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore(v: Version) {
    if (!confirm(`${formatDate(v.createdAt)} 버전으로 복원할까요?`)) return
    setRestoring(v.id)
    try {
      const content =
        contentType === 'jotting'
          ? await restoreJottingVersion(contentId, v.id)
          : await restoreVersion(contentId, v.id)
      onRestore(content)
      setOpen(false)
    } finally {
      setRestoring(null)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="p-2 rounded text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        title="버전 기록"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="5.5"/>
          <polyline points="8,5.5 8,8 10.5,9.5"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg">
          <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">버전 기록</span>
            <button
              onClick={() => setOpen(false)}
              className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-sm text-neutral-400 dark:text-neutral-500 text-center">불러오는 중...</p>
            ) : versions.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-400 dark:text-neutral-500 text-center">
                저장된 버전이 없습니다.
              </p>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{formatDate(v.createdAt)}</span>
                  <button
                    onClick={() => handleRestore(v)}
                    disabled={restoring === v.id}
                    className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors disabled:opacity-40"
                  >
                    복원
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
