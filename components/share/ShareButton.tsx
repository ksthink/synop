'use client'

import { useState, useEffect, useRef } from 'react'
import {
  createShareLink,
  getShareLinkByContent,
  deactivateShareLink,
  type ShareLink,
} from '@/lib/share'

interface Props {
  contentId: string
  contentType: 'document' | 'jotting'
}

export default function ShareButton({ contentId, contentType }: Props) {
  const [open, setOpen] = useState(false)
  const [existing, setExisting] = useState<ShareLink | null>(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (!open) return
    getShareLinkByContent(contentId).then(setExisting)
  }, [open, contentId])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPanelPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((v) => !v)
  }

  const shareUrl = (token: string) =>
    `${window.location.origin}/share/${token}`

  async function handleCreate() {
    setLoading(true)
    try {
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      const link = await createShareLink(contentType, contentId, expiresAt)
      setExisting(link)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate() {
    if (!existing) return
    setLoading(true)
    try {
      await deactivateShareLink(existing.id)
      setExisting(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(token: string) {
    await navigator.clipboard.writeText(shareUrl(token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isExpired = existing && new Date(existing.expiresAt) < new Date()

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="p-2 rounded text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors flex-shrink-0"
        title="공유 링크"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13" cy="4" r="1.5"/>
          <circle cx="13" cy="12" r="1.5"/>
          <circle cx="3" cy="8" r="1.5"/>
          <line x1="4.5" y1="7.2" x2="11.5" y2="4.8"/>
          <line x1="4.5" y1="8.8" x2="11.5" y2="11.2"/>
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed z-50 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-4"
          style={{ top: panelPos.top, right: panelPos.right }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">공유 링크</span>
            <button
              onClick={() => setOpen(false)}
              className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {existing && !isExpired ? (
            <div className="flex flex-col gap-3">
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2 break-all text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                {shareUrl(existing.token)}
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                만료: {new Date(existing.expiresAt).toLocaleDateString('ko-KR')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(existing.token)}
                  className="flex-1 py-2 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white text-sm hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
                >
                  {copied ? '복사됨!' : 'URL 복사'}
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={loading}
                  className="py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-500 dark:text-neutral-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-colors disabled:opacity-40"
                >
                  비활성화
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {isExpired && (
                <p className="text-xs text-red-400">이전 링크가 만료되었습니다.</p>
              )}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">만료일</label>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="flex-1 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-neutral-400 dark:focus:border-neutral-500 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                  <option value={1}>1일</option>
                  <option value={3}>3일</option>
                  <option value={7}>7일</option>
                  <option value={30}>30일</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="py-2 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white text-sm hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors disabled:opacity-40"
              >
                {loading ? '생성 중...' : '링크 생성'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
