import { Editor } from '@tiptap/react'

const STORAGE_KEY = 'synop_draft'

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function setupAutoSave(editor: Editor) {
  editor.on('update', () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const json = editor.getJSON()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(json))
    }, 500)
  })
}

export function loadDraft(): object | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearDraft() {
  localStorage.removeItem(STORAGE_KEY)
}
