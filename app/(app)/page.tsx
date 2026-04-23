import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import ThemeToggle from '@/components/ThemeToggle'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-neutral-900">
      <div className="w-full max-w-xl">
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-semibold tracking-widest text-neutral-800 dark:text-neutral-100">
            SYNOP
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <ModeCard
            href="/write"
            label="집필"
            description="시나리오를 작성합니다"
          />
          <ModeCard
            href="/jot"
            label="끄적"
            description="자유롭게 써봅니다"
          />
        </div>

        {user?.email && (
          <p className="mt-12 text-xs text-neutral-300 dark:text-neutral-600 text-center">
            {user.email}
          </p>
        )}
      </div>
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
      className="flex-1 flex flex-col items-center gap-2 py-12 px-6 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
    >
      <span className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{label}</span>
      <span className="text-sm text-neutral-400 dark:text-neutral-500 text-center">{description}</span>
    </Link>
  )
}
