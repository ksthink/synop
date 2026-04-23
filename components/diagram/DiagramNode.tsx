import type { Side } from '@/lib/diagram'

export const NODE_W = 130
export const NODE_H = 52

const SIDES: Side[] = ['top', 'right', 'bottom', 'left']

interface Props {
  id: string
  name: string
  x: number
  y: number
  selected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onConnectionMouseDown: (side: Side, e: React.MouseEvent) => void
  onConnectionMouseUp: (side: Side, e: React.MouseEvent) => void
  onClick: () => void
}

function cpPos(side: Side): { top: string; left: string } {
  switch (side) {
    case 'top':    return { top: '-5px', left: `${NODE_W / 2 - 5}px` }
    case 'bottom': return { top: `${NODE_H - 5}px`, left: `${NODE_W / 2 - 5}px` }
    case 'left':   return { top: `${NODE_H / 2 - 5}px`, left: '-5px' }
    case 'right':  return { top: `${NODE_H / 2 - 5}px`, left: `${NODE_W - 5}px` }
  }
}

export default function DiagramNode({
  name,
  x,
  y,
  selected,
  onMouseDown,
  onConnectionMouseDown,
  onConnectionMouseUp,
  onClick,
}: Props) {
  return (
    <div
      style={{ left: x, top: y, width: NODE_W, height: NODE_H, position: 'absolute' }}
      className="group"
    >
      {/* 연결점 */}
      {SIDES.map((side) => {
        const pos = cpPos(side)
        return (
          <div
            key={side}
            data-cp={side}
            style={{ ...pos, position: 'absolute', width: 10, height: 10, zIndex: 10 }}
            className="rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:border-neutral-600 dark:hover:border-neutral-300 hover:scale-125 transition-all cursor-crosshair"
            onMouseDown={(e) => { e.stopPropagation(); onConnectionMouseDown(side, e) }}
            onMouseUp={(e) => { e.stopPropagation(); onConnectionMouseUp(side, e) }}
          />
        )
      })}

      {/* 노드 바디 */}
      <div
        onMouseDown={onMouseDown}
        onClick={onClick}
        className={`w-full h-full flex items-center justify-center rounded-lg border-2 cursor-grab active:cursor-grabbing select-none text-sm font-medium transition-colors ${
          selected
            ? 'border-neutral-700 bg-neutral-800 text-white dark:border-neutral-300 dark:bg-neutral-200 dark:text-neutral-900'
            : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-500 dark:hover:border-neutral-400'
        }`}
      >
        <span className="truncate px-3">{name}</span>
      </div>
    </div>
  )
}
