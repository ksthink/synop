import Link from 'next/link'

export default function WritePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 bg-white dark:bg-neutral-900">
      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="inline-block mb-8 sm:mb-10 text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          ← 뒤로
        </Link>

        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-6 sm:mb-8">집필</h2>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <ActionCard
            href="/write/new"
            label="새로 쓰기"
            description="새 작품을 시작합니다"
          />
          <ActionCard
            href="/write/projects"
            label="이어 쓰기"
            description="저장된 작품을 이어씁니다"
          />
        </div>
      </div>
    </div>
  )
}

function ActionCard({
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
      className="flex-1 flex flex-col items-center gap-2 py-8 sm:py-12 px-4 sm:px-6 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
    >
      <span className="text-base font-semibold text-neutral-800 dark:text-neutral-100">{label}</span>
      <span className="text-sm text-neutral-400 dark:text-neutral-500 text-center">{description}</span>
    </Link>
  )
}
