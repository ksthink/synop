import ScenarioPageClient from './ScenarioPageClient'

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ScenarioPageClient projectId={id} />
}
