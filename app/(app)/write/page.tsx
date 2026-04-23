import Link from 'next/link'

export default function WritePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="inline-block mb-10 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          ← 뒤로
        </Link>

        <h2 className="text-xl font-semibold text-neutral-800 mb-8">집필</h2>

        <div className="flex flex-col sm:flex-row gap-4">
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
      className="flex-1 flex flex-col items-center gap-2 py-12 px-6 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
    >
      <span className="text-base font-semibold text-neutral-800">{label}</span>
      <span className="text-sm text-neutral-400 text-center">{description}</span>
    </Link>
  )
}
