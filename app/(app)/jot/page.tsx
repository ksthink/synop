import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getJottings, type Jotting } from '@/lib/jottings'
import JotList from './JotList'

export default async function JotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let jottings: Jotting[] = []
  let fetchError = ''
  try {
    jottings = await getJottings(user.id, supabase)
  } catch {
    fetchError = '목록을 불러오는 데 실패했습니다.'
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12 bg-white dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <Link
              href="/"
              className="inline-block mb-2 text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              ← 뒤로
            </Link>
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">끄적</h2>
          </div>
          <Link
            href="/jot/new"
            className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm hover:bg-neutral-700 transition-colors"
          >
            새로 쓰기
          </Link>
        </div>

        {fetchError ? (
          <p className="text-sm text-red-500">{fetchError}</p>
        ) : (
          <JotList jottings={jottings} />
        )}
      </div>
    </div>
  )
}
