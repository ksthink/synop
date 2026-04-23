'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-neutral-900">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-8 tracking-widest">
          SYNOP
        </h1>

        <form action={action} className="flex flex-col gap-5">
          {(['이름', '필명', '이메일', '비밀번호'] as const).map(() => null)}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500 dark:text-neutral-400">이름</label>
            <input
              name="name"
              type="text"
              autoFocus
              className="border-b border-neutral-300 dark:border-neutral-600 bg-transparent py-2 text-neutral-800 dark:text-neutral-200 placeholder-neutral-300 dark:placeholder-neutral-600 outline-none focus:border-neutral-600 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500 dark:text-neutral-400">필명</label>
            <input
              name="pen_name"
              type="text"
              className="border-b border-neutral-300 dark:border-neutral-600 bg-transparent py-2 text-neutral-800 dark:text-neutral-200 placeholder-neutral-300 dark:placeholder-neutral-600 outline-none focus:border-neutral-600 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500 dark:text-neutral-400">이메일</label>
            <input
              name="email"
              type="email"
              required
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
            {pending ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-neutral-700 dark:text-neutral-300 underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
