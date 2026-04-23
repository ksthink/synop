'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default function ProjectHeader({ projectId, title }: { projectId: string; title: string }) {
  const pathname = usePathname()
  const isHub = pathname === `/write/${projectId}`
  const backHref = isHub ? '/write/projects' : `/write/${projectId}`

  return (
    <header className="no-print border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
      <Link
        href={backHref}
        className="flex-shrink-0 text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        ←
      </Link>
      <span className="font-medium text-neutral-800 dark:text-neutral-100 truncate flex-1 min-w-0">
        {title}
      </span>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
