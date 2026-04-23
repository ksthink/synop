'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

const SECTION_LABELS: Record<string, string> = {
  intention:  '기획의도',
  characters: '등장인물',
  synopsis:   '시놉시스',
  scenario:   '시나리오',
}

export default function ProjectHeader({ projectId, title }: { projectId: string; title: string }) {
  const pathname = usePathname()
  const segment = pathname.split('/').pop() ?? ''
  const sectionLabel = SECTION_LABELS[segment]
  const isHub = !sectionLabel

  return (
    <header className="no-print border-b border-neutral-200 dark:border-neutral-800 px-8 sm:px-12 py-6 flex items-center gap-6 sm:gap-8">
      <Link
        href={isHub ? '/write/projects' : `/write/${projectId}`}
        className="flex-shrink-0 text-xl text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        ←
      </Link>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className={`text-2xl font-medium truncate ${sectionLabel ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-100'}`}>
          {title}
        </span>
        {sectionLabel && (
          <>
            <span className="text-xl text-neutral-300 dark:text-neutral-600 flex-shrink-0">|</span>
            <span className="text-2xl font-medium text-neutral-800 dark:text-neutral-100 flex-shrink-0">
              {sectionLabel}
            </span>
          </>
        )}
      </div>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
