'use client'

import dynamic from 'next/dynamic'

const ScenarioEditor = dynamic(
  () => import('@/components/editor/ScenarioEditor'),
  { ssr: false }
)

export default function ScenarioPageClient({ projectId }: { projectId: string }) {
  return <ScenarioEditor projectId={projectId} />
}
