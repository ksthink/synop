'use client'

import { useState } from 'react'
import {
  createCharacter,
  updateCharacter,
  deleteCharacter,
  type Character,
  type CreateCharacterInput,
} from '@/lib/characters'

interface Props {
  projectId: string
  character?: Character | null
  onSave: (character: Character) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

export default function CharacterForm({
  projectId,
  character,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState(character?.name ?? '')
  const [gender, setGender] = useState(character?.gender ?? '')
  const [age, setAge] = useState(character?.age?.toString() ?? '')
  const [job, setJob] = useState(character?.job ?? '')
  const [summary, setSummary] = useState(character?.summary ?? '')
  const [description, setDescription] = useState(character?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const input: CreateCharacterInput = {
        name: name.trim(),
        gender: gender || null,
        age: age ? parseInt(age, 10) : null,
        job: job.trim() || null,
        summary: summary.trim() || null,
        description: description.trim() || null,
      }
      const saved = character
        ? await updateCharacter(character.id, input)
        : await createCharacter(projectId, input)
      onSave(saved)
    } catch {
      setError('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!character) return
    if (!confirm('삭제하면 관계도의 해당 노드도 함께 삭제됩니다. 계속할까요?')) return
    try {
      await deleteCharacter(character.id)
      onDelete?.(character.id)
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-10">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          ← 목록
        </button>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          {character && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              삭제
            </button>
          )}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="text-sm px-4 py-1.5 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white disabled:opacity-40 hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <Field label="이름">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder="캐릭터 이름"
          className="w-full border-b border-neutral-300 dark:border-neutral-600 bg-transparent py-2 text-xl font-medium text-neutral-800 dark:text-neutral-200 placeholder-neutral-300 dark:placeholder-neutral-600 outline-none focus:border-neutral-600 dark:focus:border-neutral-400 transition-colors"
        />
      </Field>

      <div className="grid grid-cols-3 gap-8">
        <Field label="성별">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="field-input"
          >
            <option value="">-</option>
            <option value="남">남</option>
            <option value="여">여</option>
            <option value="기타">기타</option>
          </select>
        </Field>
        <Field label="나이">
          <input
            type="number"
            min={0}
            max={200}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="직업">
          <input
            value={job}
            onChange={(e) => setJob(e.target.value)}
            className="field-input"
          />
        </Field>
      </div>

      <Field label="요약">
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="한 줄 소개"
          className="field-input"
        />
      </Field>

      <Field label="소개">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="캐릭터에 대한 자세한 설명을 적어주세요"
          rows={8}
          className="field-input resize-none leading-relaxed"
        />
      </Field>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs tracking-widest uppercase text-neutral-400 dark:text-neutral-500">
        {label}
      </label>
      {children}
    </div>
  )
}
