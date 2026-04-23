'use client'

import { useState, useEffect } from 'react'

export type EditorFont = 'nanum-gothic' | 'mulmaru' | 'kopub' | 'iyagi'

export const FONT_OPTIONS: { value: EditorFont; label: string; family: string }[] = [
  { value: 'nanum-gothic', label: '나눔고딕', family: "'Nanum Gothic', sans-serif" },
  { value: 'mulmaru',      label: '물마루',   family: "'Mulmaru', 'Nanum Gothic', sans-serif" },
  { value: 'kopub',        label: '코퍼브',   family: "'KoPubDotumMedium', 'KoPub 돋움체', 'Nanum Gothic', sans-serif" },
  { value: 'iyagi',        label: '이야기',   family: "'IyagiGGC', '이야기굵은체', 'Nanum Gothic', sans-serif" },
]

export function useEditorFont() {
  const [font, setFont] = useState<EditorFont>('nanum-gothic')

  useEffect(() => {
    const stored = localStorage.getItem('editor-font') as EditorFont | null
    if (stored && FONT_OPTIONS.some((f) => f.value === stored)) {
      setFont(stored)
    }
  }, [])

  function changeFont(f: EditorFont) {
    setFont(f)
    localStorage.setItem('editor-font', f)
  }

  const currentFamily = FONT_OPTIONS.find((f) => f.value === font)?.family ?? FONT_OPTIONS[0].family

  return { font, changeFont, currentFamily }
}
