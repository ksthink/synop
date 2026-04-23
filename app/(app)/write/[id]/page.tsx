import Link from 'next/link'

const SECTIONS = [
  { key: 'intention',  label: '기획의도', description: '작품의 핵심 의도와 방향성' },
  { key: 'characters', label: '등장인물', description: '인물 설정과 관계도' },
  { key: 'synopsis',   label: '시놉시스', description: '이야기의 흐름과 구조' },
  { key: 'scenario',   label: '시나리오', description: '대본을 직접 씁니다' },
] as const

export default async function ProjectHubPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg grid grid-cols-2 gap-4">
        {SECTIONS.map((section) => (
          <Link
            key={section.key}
            href={`/write/${id}/${section.key}`}
            className="flex flex-col gap-2 p-8 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
              {section.label}
            </span>
            <span className="text-sm text-neutral-400 dark:text-neutral-500">
              {section.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
