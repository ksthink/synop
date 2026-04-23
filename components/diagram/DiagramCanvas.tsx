'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DiagramNode, DiagramEdge, Side } from '@/lib/diagram'
import { saveDiagram } from '@/lib/diagram'
import type { Character } from '@/lib/characters'
import DiagramNodeComp, { NODE_W, NODE_H } from './DiagramNode'
import DiagramEdges, { PreviewEdge, getConnectionPoint } from './DiagramEdge'
import CharacterForm from '@/components/characters/CharacterForm'

const GRID = 20
const CANVAS_W = 3000
const CANVAS_H = 2000

function snap(v: number): number {
  return Math.round(v / GRID) * GRID
}

interface Props {
  projectId: string
  characters: Character[]
  initialNodes: DiagramNode[]
  initialEdges: DiagramEdge[]
  onCharacterUpdate: (c: Character) => void
  onCharacterDelete: (id: string) => void
}

interface DragNode { id: string; offsetX: number; offsetY: number }
interface DragEdge { fromNodeId: string; fromSide: Side; x: number; y: number }
interface PendingEdge { fromNodeId: string; toNodeId: string; fromSide: Side; toSide: Side }
interface ClickPos { worldX: number; worldY: number; screenX: number; screenY: number }

export default function DiagramCanvas({
  projectId,
  characters,
  initialNodes,
  initialEdges,
  onCharacterUpdate,
  onCharacterDelete,
}: Props) {
  const [nodes, setNodes] = useState<DiagramNode[]>(initialNodes)
  const [edges, setEdges] = useState<DiagramEdge[]>(initialEdges)
  const [dragNode, setDragNode] = useState<DragNode | null>(null)
  const [dragEdge, setDragEdge] = useState<DragEdge | null>(null)
  const [pendingEdge, setPendingEdge] = useState<PendingEdge | null>(null)
  const [edgeLabel, setEdgeLabel] = useState('')
  const [clickPos, setClickPos] = useState<ClickPos | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1.0)

  const canvasRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const zoomRef = useRef(zoom)
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  const charMap = new Map(characters.map((c) => [c.id, c]))
  const nodeCharIds = new Set(nodes.map((n) => n.characterId))
  const availableChars = characters.filter((c) => !nodeCharIds.has(c.id))
  const selectedChar = selectedNodeId
    ? charMap.get(nodes.find((n) => n.id === selectedNodeId)?.characterId ?? '') ?? null
    : null

  const scheduleSave = useCallback((n: DiagramNode[], e: DiagramEdge[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDiagram(projectId, n, e), 1000)
  }, [projectId])

  function canvasCoords(e: MouseEvent | React.MouseEvent): { x: number; y: number } {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    const z = zoomRef.current
    return {
      x: (e.clientX - rect.left + canvasRef.current.scrollLeft) / z,
      y: (e.clientY - rect.top + canvasRef.current.scrollTop) / z,
    }
  }

  // 스크롤 줌
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      setZoom((prev) => +(Math.max(0.25, Math.min(2.0, prev * factor)).toFixed(2)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!canvasRef.current) return
      const pos = canvasCoords(e)
      if (dragNode) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragNode.id
              ? {
                  ...n,
                  x: Math.max(0, snap(pos.x - dragNode.offsetX)),
                  y: Math.max(0, snap(pos.y - dragNode.offsetY)),
                }
              : n
          )
        )
      }
      if (dragEdge) {
        setDragEdge((d) => (d ? { ...d, x: pos.x, y: pos.y } : null))
      }
    }

    function onUp() {
      if (dragNode) {
        setNodes((prev) => {
          scheduleSave(prev, edges)
          return prev
        })
        setDragNode(null)
      }
      if (dragEdge) setDragEdge(null)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragNode, dragEdge, edges, scheduleSave])

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    setMouseDownPos(canvasCoords(e))
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (
      (e.target as HTMLElement).closest('[data-node]') ||
      (e.target as HTMLElement).closest('[data-cp]')
    ) return

    const pos = canvasCoords(e)
    if (!mouseDownPos) return
    const dist = Math.hypot(pos.x - mouseDownPos.x, pos.y - mouseDownPos.y)
    if (dist > 5) return

    setSelectedNodeId(null)
    if (availableChars.length > 0) {
      setClickPos({ worldX: pos.x, worldY: pos.y, screenX: e.clientX, screenY: e.clientY })
    }
  }

  function addNode(charId: string) {
    if (!clickPos) return
    const node: DiagramNode = {
      id: charId,
      characterId: charId,
      x: Math.max(0, snap(clickPos.worldX - NODE_W / 2)),
      y: Math.max(0, snap(clickPos.worldY - NODE_H / 2)),
    }
    const next = [...nodes, node]
    setNodes(next)
    setClickPos(null)
    scheduleSave(next, edges)
  }

  function handleNodeMouseDown(nodeId: string, e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-cp]')) return
    e.stopPropagation()
    const node = nodes.find((n) => n.id === nodeId)!
    const pos = canvasCoords(e)
    setDragNode({ id: nodeId, offsetX: pos.x - node.x, offsetY: pos.y - node.y })
  }

  function handleCpMouseDown(nodeId: string, side: Side, e: React.MouseEvent) {
    const node = nodes.find((n) => n.id === nodeId)!
    const cp = getConnectionPoint(node, side)
    setDragEdge({ fromNodeId: nodeId, fromSide: side, x: cp.x, y: cp.y })
  }

  function handleCpMouseUp(nodeId: string, side: Side) {
    if (!dragEdge || dragEdge.fromNodeId === nodeId) return
    const alreadyConnected = edges.some(
      (e) =>
        (e.fromNodeId === dragEdge.fromNodeId && e.toNodeId === nodeId) ||
        (e.fromNodeId === nodeId && e.toNodeId === dragEdge.fromNodeId)
    )
    if (alreadyConnected) { setDragEdge(null); return }
    setPendingEdge({
      fromNodeId: dragEdge.fromNodeId,
      toNodeId: nodeId,
      fromSide: dragEdge.fromSide,
      toSide: side,
    })
    setEdgeLabel('')
    setDragEdge(null)
  }

  function confirmEdge() {
    if (!pendingEdge) return
    const edge: DiagramEdge = {
      id: crypto.randomUUID(),
      ...pendingEdge,
      label: edgeLabel.trim(),
    }
    const next = [...edges, edge]
    setEdges(next)
    setPendingEdge(null)
    scheduleSave(nodes, next)
  }

  function handleEditLabel(id: string, label: string) {
    const next = edges.map((e) => (e.id === id ? { ...e, label } : e))
    setEdges(next)
    scheduleSave(nodes, next)
  }

  function handleDeleteEdge(id: string) {
    const next = edges.filter((e) => e.id !== id)
    setEdges(next)
    scheduleSave(nodes, next)
  }

  function handleDeleteNode(charId: string) {
    const nextNodes = nodes.filter((n) => n.id !== charId)
    const nextEdges = edges.filter((e) => e.fromNodeId !== charId && e.toNodeId !== charId)
    setNodes(nextNodes)
    setEdges(nextEdges)
    setSelectedNodeId(null)
    scheduleSave(nextNodes, nextEdges)
    onCharacterDelete(charId)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 캔버스 */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto select-none bg-neutral-50 dark:bg-neutral-900"
        onMouseDown={handleCanvasMouseDown}
        onClick={handleCanvasClick}
      >
        {/* 스케일 레이어 */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            width: CANVAS_W,
            height: CANVAS_H,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* 도트 그리드 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(circle, var(--diagram-dot) 1.5px, transparent 1.5px)`,
              backgroundSize: `${GRID}px ${GRID}px`,
            }}
          />

          {/* SVG 레이어 (엣지) */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CANVAS_W,
              height: CANVAS_H,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            <DiagramEdges
              edges={edges}
              nodes={nodes}
              onEditLabel={handleEditLabel}
              onDeleteEdge={handleDeleteEdge}
            />
            {dragEdge && (
              <PreviewEdge
                from={{ x: dragEdge.x, y: dragEdge.y, side: dragEdge.fromSide }}
                to={{ x: dragEdge.x, y: dragEdge.y }}
              />
            )}
          </svg>

          {/* 노드 레이어 */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
            {nodes.map((node) => {
              const char = charMap.get(node.characterId)
              if (!char) return null
              return (
                <DiagramNodeComp
                  key={node.id}
                  id={node.id}
                  name={char.name}
                  x={node.x}
                  y={node.y}
                  selected={selectedNodeId === node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  onConnectionMouseDown={(side, e) => handleCpMouseDown(node.id, side, e)}
                  onConnectionMouseUp={(side) => handleCpMouseUp(node.id, side)}
                  onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                />
              )
            })}
          </div>
        </div>

        {/* 캐릭터 선택 드롭다운 (fixed, 스케일 무관) */}
        {clickPos && (
          <div
            className="fixed z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg py-1 min-w-40"
            style={{ left: clickPos.screenX, top: clickPos.screenY }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 py-1.5 text-xs text-neutral-400 dark:text-neutral-500">캐릭터 추가</p>
            {availableChars.map((c) => (
              <button
                key={c.id}
                onClick={() => addNode(c.id)}
                className="w-full text-left px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => setClickPos(null)}
              className="w-full text-left px-3 py-1.5 text-xs text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700 border-t border-neutral-100 dark:border-neutral-700 mt-1"
            >
              취소
            </button>
          </div>
        )}

        {/* 빈 상태 */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              {characters.length === 0
                ? '먼저 캐릭터를 등록해 주세요.'
                : '빈 곳을 클릭해 캐릭터를 추가하세요.'}
            </p>
          </div>
        )}

        {/* 줌 컨트롤 */}
        <div className="absolute bottom-4 right-4 z-50 flex items-center gap-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm px-1 py-0.5 select-none">
          <button
            onClick={() => setZoom((z) => +(Math.max(0.25, z - 0.1).toFixed(1)))}
            className="w-7 h-7 flex items-center justify-center rounded text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-lg leading-none transition-colors"
            title="축소"
          >
            −
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="text-xs text-neutral-500 dark:text-neutral-400 w-10 text-center tabular-nums hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors py-1"
            title="100% 초기화"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => +(Math.min(2.0, z + 0.1).toFixed(1)))}
            className="w-7 h-7 flex items-center justify-center rounded text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-lg leading-none transition-colors"
            title="확대"
          >
            +
          </button>
        </div>
      </div>

      {/* 관계 입력 모달 */}
      {pendingEdge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50">
          <div
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-6 w-72"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-4">관계 설명</h3>
            <input
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              placeholder="예: 친구, 배우자, 동료"
              autoFocus
              className="field-input mb-4"
              onKeyDown={(e) => { if (e.key === 'Enter') confirmEdge() }}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmEdge}
                className="flex-1 py-2 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white text-sm hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
              >
                확인
              </button>
              <button
                onClick={() => setPendingEdge(null)}
                className="py-2 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 선택된 캐릭터 패널 */}
      {selectedNodeId && selectedChar && (
        <div className="w-72 border-l border-neutral-200 dark:border-neutral-800 p-5 overflow-y-auto flex-shrink-0 bg-white dark:bg-neutral-900">
          <CharacterForm
            projectId={projectId}
            character={selectedChar}
            onSave={(c) => { onCharacterUpdate(c); setSelectedNodeId(null) }}
            onDelete={handleDeleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        </div>
      )}
    </div>
  )
}
