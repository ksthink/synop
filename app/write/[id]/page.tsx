'use client'

import dynamic from 'next/dynamic'
import { use } from 'react'

const Editor = dynamic(() => import('@/components/editor/Editor'), { ssr: false })

export default function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <Editor projectId={id} />
}
