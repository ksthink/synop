'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getCharacters, type Character } from '@/lib/characters'
import { getDiagram, type DiagramNode, type DiagramEdge } from '@/lib/diagram'
import CharacterList from '@/components/characters/CharacterList'
import DiagramCanvas from '@/components/diagram/DiagramCanvas'

type Tab = 'list' | 'diagram'

export default function CharactersPage() {
  const params = useParams()
  const projectId = params.id as string

  const [tab, setTab] = useState<Tab>('list')
  const [characters, setCharacters] = useState<Character[]>([])
  const [nodes, setNodes] = useState<DiagramNode[]>([])
  const [edges, setEdges] = useState<DiagramEdge[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const [chars, diagram] = await Promise.all([
        getCharacters(projectId),
        getDiagram(projectId),
      ])
      setCharacters(chars)
      setNodes(diagram.nodes)
      setEdges(diagram.edges)
      setLoaded(true)
    }
    load()
  }, [projectId])

  function handleCharacterUpdate(c: Character) {
    setCharacters((prev) => prev.map((x) => (x.id === c.id ? c : x)))
  }

  function handleCharacterDelete(id: string) {
    setCharacters((prev) => prev.filter((x) => x.id !== id))
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-neutral-400">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 97px)' }}>
      {/* 탭 */}
      <div className="flex border-b border-neutral-200 px-6">
        {(['list', 'diagram'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-1 mr-6 text-sm border-b-2 transition-colors ${
              tab === t
                ? 'border-neutral-800 text-neutral-800 font-medium'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t === 'list' ? '캐릭터 목록' : '관계도'}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {tab === 'list' ? (
          <CharacterList
            projectId={projectId}
            initialCharacters={characters}
          />
        ) : (
          <DiagramCanvas
            projectId={projectId}
            characters={characters}
            initialNodes={nodes}
            initialEdges={edges}
            onCharacterUpdate={handleCharacterUpdate}
            onCharacterDelete={handleCharacterDelete}
          />
        )}
      </div>
    </div>
  )
}
