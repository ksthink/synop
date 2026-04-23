import type { Character } from '@/lib/characters'
import { isIncomplete } from '@/lib/characters'

interface Props {
  character: Character
  onClick: () => void
}

export default function CharacterCard({ character, onClick }: Props) {
  const incomplete = isIncomplete(character)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-neutral-200 dark:border-neutral-700 px-5 py-4 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">{character.name}</span>
        {incomplete && (
          <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500">
            정보 미입력
          </span>
        )}
      </div>

      {!incomplete && (
        <div className="flex gap-2 text-xs text-neutral-400 dark:text-neutral-500 mb-1">
          {character.gender && <span>{character.gender}</span>}
          {character.age != null && <span>{character.age}세</span>}
          {character.job && <span>{character.job}</span>}
        </div>
      )}

      {character.summary && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">{character.summary}</p>
      )}
    </button>
  )
}
