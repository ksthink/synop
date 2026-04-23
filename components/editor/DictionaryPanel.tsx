'use client'

import { useState, useRef } from 'react'

interface Sense {
  sense_no: string
  definition: string
  pos?: string
}

interface DictItem {
  word: string
  sup_no?: string
  sense: Sense | Sense[]
}

function normalizeSenses(raw: Sense | Sense[]): Sense[] {
  return Array.isArray(raw) ? raw : [raw]
}

export default function DictionaryPanel() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DictItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPanelPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen((v) => !v)
  }

  async function handleSearch(q = query) {
    const term = q.trim()
    if (!term) return
    setLoading(true)
    setSearched(false)
    setResults([])
    try {
      const res = await fetch(`/api/dictionary?q=${encodeURIComponent(term)}`)
      const data = await res.json()
      const items: DictItem[] = data?.channel?.item
        ? (Array.isArray(data.channel.item) ? data.channel.item : [data.channel.item])
        : []
      setResults(items)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="px-3 py-1.5 rounded text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
      >
        사전
      </button>

      {open && (
        <div
          className="fixed z-50 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg"
          style={{ top: panelPos.top, right: panelPos.right }}
        >
          <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">표준국어대사전</span>
            <button
              onClick={() => setOpen(false)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="p-3">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder="단어 검색..."
                autoFocus
                className="flex-1 border-b border-neutral-300 dark:border-neutral-600 bg-transparent text-sm text-neutral-800 dark:text-neutral-200 outline-none focus:border-neutral-600 dark:focus:border-neutral-400 py-1"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="text-sm px-3 py-1 rounded bg-neutral-800 dark:bg-neutral-700 text-white hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors disabled:opacity-40"
              >
                검색
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto px-3 pb-3">
            {loading && (
              <p className="py-4 text-sm text-neutral-400 text-center">검색 중...</p>
            )}
            {!loading && searched && results.length === 0 && (
              <p className="py-4 text-sm text-neutral-400 dark:text-neutral-500 text-center">검색 결과가 없습니다.</p>
            )}
            {results.map((item, i) => {
              const senses = normalizeSenses(item.sense).slice(0, 3)
              const label = item.sup_no && item.sup_no !== '0'
                ? `${item.word}${item.sup_no}`
                : item.word
              return (
                <div key={i} className="mb-4">
                  <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1.5">
                    {label}
                  </p>
                  {senses.map((s, j) => (
                    <div key={j} className="mb-2 pl-2 border-l-2 border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0">
                          {j + 1}.
                        </span>
                        {s.pos && (
                          <span className="text-[11px] text-blue-400 dark:text-blue-500 shrink-0">
                            「{s.pos}」
                          </span>
                        )}
                        <span className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {s.definition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
