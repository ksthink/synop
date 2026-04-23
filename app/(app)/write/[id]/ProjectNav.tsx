'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { key: 'intention', label: '기획의도' },
  { key: 'characters', label: '등장인물' },
  { key: 'synopsis', label: '시놉시스' },
  { key: 'scenario', label: '시나리오' },
] as const

export default function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname()

  return (
    <nav className="no-print border-b border-neutral-200 dark:border-neutral-800 px-6 flex gap-1">
      {NAV_ITEMS.map((item) => {
        const href = `/write/${projectId}/${item.key}`
        const active = pathname.endsWith(`/${item.key}`)
        return (
          <Link
            key={item.key}
            href={href}
            className={`px-4 py-3 text-sm border-b-2 transition-colors ${
              active
                ? 'text-neutral-800 dark:text-neutral-100 border-neutral-800 dark:border-neutral-300'
                : 'text-neutral-400 dark:text-neutral-500 border-transparent hover:text-neutral-600 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
