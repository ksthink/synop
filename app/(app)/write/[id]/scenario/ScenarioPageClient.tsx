'use client'

import dynamic from 'next/dynamic'

const ScenarioEditor = dynamic(
  () => import('@/components/editor/ScenarioEditor'),
  { ssr: false }
)

interface InitialDoc { id: string; content: string }

export default function ScenarioPageClient({
  projectId,
  initialDoc,
}: {
  projectId: string
  initialDoc: InitialDoc
}) {
  return <ScenarioEditor projectId={projectId} initialDoc={initialDoc} />
}
