import type { DiagramEdge as Edge, DiagramNode, Side } from '@/lib/diagram'
import { NODE_W, NODE_H } from './DiagramNode'
import RelationLabel from './RelationLabel'

interface Props {
  edges: Edge[]
  nodes: DiagramNode[]
  onEditLabel: (id: string, label: string) => void
  onDeleteEdge: (id: string) => void
}

export function getConnectionPoint(node: DiagramNode, side: Side): { x: number; y: number } {
  switch (side) {
    case 'top':    return { x: node.x + NODE_W / 2, y: node.y }
    case 'bottom': return { x: node.x + NODE_W / 2, y: node.y + NODE_H }
    case 'left':   return { x: node.x, y: node.y + NODE_H / 2 }
    case 'right':  return { x: node.x + NODE_W, y: node.y + NODE_H / 2 }
  }
}

function makePoints(
  fx: number, fy: number, fromSide: Side,
  tx: number, ty: number
): string {
  const midX = (fx + tx) / 2
  const midY = (fy + ty) / 2

  if (fromSide === 'left' || fromSide === 'right') {
    return `${fx},${fy} ${midX},${fy} ${midX},${ty} ${tx},${ty}`
  } else {
    return `${fx},${fy} ${fx},${midY} ${tx},${midY} ${tx},${ty}`
  }
}

function midpoint(points: string): { x: number; y: number } {
  const parts = points.trim().split(' ').map((p) => {
    const [x, y] = p.split(',').map(Number)
    return { x, y }
  })
  const mid = Math.floor(parts.length / 2)
  const a = parts[mid - 1]
  const b = parts[mid]
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export default function DiagramEdges({ edges, nodes, onEditLabel, onDeleteEdge }: Props) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <>
      {edges.map((edge) => {
        const from = nodeMap.get(edge.fromNodeId)
        const to = nodeMap.get(edge.toNodeId)
        if (!from || !to) return null

        const fp = getConnectionPoint(from, edge.fromSide)
        const tp = getConnectionPoint(to, edge.toSide)
        const pts = makePoints(fp.x, fp.y, edge.fromSide, tp.x, tp.y)
        const mid = midpoint(pts)

        return (
          <g key={edge.id}>
            <polyline
              points={pts}
              fill="none"
              stroke="#d1d5db"
              strokeWidth={1.5}
            />
            <RelationLabel
              x={mid.x}
              y={mid.y}
              label={edge.label}
              onEdit={(label) => onEditLabel(edge.id, label)}
              onDelete={() => onDeleteEdge(edge.id)}
            />
          </g>
        )
      })}
    </>
  )
}

// 드래그 중 미리보기 선
export function PreviewEdge({ from, to }: { from: { x: number; y: number; side: Side }; to: { x: number; y: number } }) {
  const pts = makePoints(from.x, from.y, from.side, to.x, to.y)
  return (
    <polyline
      points={pts}
      fill="none"
      stroke="#9ca3af"
      strokeWidth={1.5}
      strokeDasharray="4 3"
    />
  )
}
