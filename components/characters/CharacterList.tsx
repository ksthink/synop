'use client'

import { useState } from 'react'
import type { Character } from '@/lib/characters'
import CharacterCard from './CharacterCard'
import CharacterForm from './CharacterForm'

interface Props {
  projectId: string
  initialCharacters: Character[]
}

export default function CharacterList({ projectId, initialCharacters }: Props) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const selectedChar = selectedId ? characters.find((c) => c.id === selectedId) ?? null : null
  const panelOpen = adding || selectedId !== null

  function handleSave(saved: Character) {
    setCharacters((prev) => {
      const exists = prev.some((c) => c.id === saved.id)
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved]
    })
    setAdding(false)
    setSelectedId(null)
  }

  function handleDelete(id: string) {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
    setSelectedId(null)
    setAdding(false)
  }

  function closePanel() {
    setAdding(false)
    setSelectedId(null)
  }

  if (panelOpen) {
    return (
      <div className="flex-1 overflow-y-auto flex justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <CharacterForm
            projectId={projectId}
            character={adding ? null : selectedChar}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={closePanel}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">등장인물</h2>
        <button
          onClick={() => setAdding(true)}
          className="text-sm px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          + 캐릭터 추가
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-400 dark:text-neutral-500">
          <p className="text-sm mb-4">등록된 캐릭터가 없습니다.</p>
          <button
            onClick={() => setAdding(true)}
            className="text-sm px-4 py-2 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
          >
            첫 캐릭터 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {characters.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              onClick={() => { setAdding(false); setSelectedId(c.id) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
