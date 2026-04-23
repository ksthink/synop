import Link from 'next/link'
import RecentProjects from '@/components/RecentProjects'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900 px-6">
      <h1 className="text-2xl font-bold tracking-widest mb-16 text-neutral-800 dark:text-neutral-100">
        SYNOP
      </h1>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        <ModeCard
          href="/write"
          label="집필"
          description="작품을 시작합니다"
        />
        <ModeCard
          href="/practice"
          label="연습"
          description="부담 없이 써봅니다"
        />
        <ModeCard
          href="/projects"
          label="목록"
          description="저장된 작품 목록"
        />
      </div>

      <RecentProjects />
    </div>
  )
}

function ModeCard({
  href,
  label,
  description,
}: {
  href: string
  label: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center gap-2 py-10 px-6 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
    >
      <span className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
        {label}
      </span>
      <span className="text-sm text-neutral-400 dark:text-neutral-500 text-center">
        {description}
      </span>
    </Link>
  )
}
