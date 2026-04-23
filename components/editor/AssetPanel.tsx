'use client'

interface Props {
  characters: string[]
}

export default function AssetPanel({ characters }: Props) {
  return (
    <nav className="flex flex-col gap-1">
      <p className="text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase mb-2">
        인물
      </p>
      {characters.map((name) => (
        <span
          key={name}
          className="text-xs text-neutral-500 dark:text-neutral-400 truncate px-1"
        >
          {name}
        </span>
      ))}
    </nav>
  )
}
