'use client'

import { FONT_OPTIONS, type EditorFont } from '@/hooks/useEditorFont'

interface Props {
  value: EditorFont
  onChange: (f: EditorFont) => void
}

export default function FontSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EditorFont)}
      className="text-sm text-neutral-500 dark:text-neutral-400 bg-transparent border-none outline-none cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors py-1"
      title="폰트 선택"
    >
      {FONT_OPTIONS.map((f) => (
        <option key={f.value} value={f.value}>
          {f.label}
        </option>
      ))}
    </select>
  )
}
