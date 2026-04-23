'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-neutral-900">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-8 tracking-widest">
          SYNOP
        </h1>

        <form action={action} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500 dark:text-neutral-400">이메일</label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="border-b border-neutral-300 dark:border-neutral-600 bg-transparent py-2 text-neutral-800 dark:text-neutral-200 placeholder-neutral-300 dark:placeholder-neutral-600 outline-none focus:border-neutral-600 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500 dark:text-neutral-400">비밀번호</label>
            <input
              name="password"
              type="password"
              required
              className="border-b border-neutral-300 dark:border-neutral-600 bg-transparent py-2 text-neutral-800 dark:text-neutral-200 placeholder-neutral-300 dark:placeholder-neutral-600 outline-none focus:border-neutral-600 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 py-3 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white text-sm font-medium disabled:opacity-40 hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
          >
            {pending ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-neutral-700 dark:text-neutral-300 underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
