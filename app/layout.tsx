import type { Metadata } from 'next'
import { Nanum_Gothic } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

const nanumGothic = Nanum_Gothic({
  weight: ['400', '700', '800'],
  subsets: ['latin'],
  variable: '--font-nanum-gothic',
})

const mulmaru = localFont({
  src: '../public/fonts/Mulmaru.woff2',
  variable: '--font-mulmaru',
  display: 'swap',
})

const iyagi = localFont({
  src: '../public/fonts/IyagiGGC.woff2',
  variable: '--font-iyagi',
  display: 'swap',
})

const kopub = localFont({
  src: '../public/fonts/KoPubBatang.woff2',
  variable: '--font-kopub',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Synop — 시나리오 에디터',
  description: '한국 시나리오 작가를 위한 전문 집필 도구',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${nanumGothic.variable} ${mulmaru.variable} ${iyagi.variable} ${kopub.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
