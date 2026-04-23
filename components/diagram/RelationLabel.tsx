'use client'

import { useState } from 'react'

interface Props {
  x: number
  y: number
  label: string
  onEdit: (label: string) => void
  onDelete: () => void
}

export default function RelationLabel({ x, y, label, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(label)

  const display = label || '+'

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen((v) => !v)
  }

  function handleSave() {
    onEdit(value)
    setEditing(false)
    setOpen(false)
  }

  return (
    <g>
      <rect
        x={x - 28}
        y={y - 10}
        width={56}
        height={20}
        rx={4}
        className="fill-white dark:fill-neutral-800 stroke-neutral-200 dark:stroke-neutral-700"
        strokeWidth={1}
        style={{ cursor: 'pointer', pointerEvents: 'all' }}
        onClick={handleClick}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize={11}
        className="fill-neutral-500 dark:fill-neutral-400"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {display.length > 6 ? display.slice(0, 5) + '…' : display}
      </text>

      {open && (
        <foreignObject
          x={x - 80}
          y={y + 14}
          width={160}
          height={editing ? 80 : 60}
          style={{ pointerEvents: 'all' }}
        >
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-md p-2 flex flex-col gap-1.5">
            {editing ? (
              <>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                  className="border-b border-neutral-300 dark:border-neutral-600 text-xs py-1 outline-none w-full bg-transparent text-neutral-800 dark:text-neutral-200"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                />
                <div className="flex gap-1">
                  <button onClick={handleSave} className="flex-1 py-1 text-xs bg-neutral-800 dark:bg-neutral-700 text-white rounded">저장</button>
                  <button onClick={() => setEditing(false)} className="py-1 px-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded text-neutral-600 dark:text-neutral-400">취소</button>
                </div>
              </>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded"
                >
                  수정
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false) }}
                  className="py-1 px-2 text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  )
}
