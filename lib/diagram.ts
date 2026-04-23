import { createClient } from './supabase/client'

export type Side = 'top' | 'bottom' | 'left' | 'right'

export interface DiagramNode {
  id: string
  characterId: string
  x: number
  y: number
}

export interface DiagramEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  fromSide: Side
  toSide: Side
  label: string
}

export interface Diagram {
  id: string | null
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export async function getDiagram(projectId: string): Promise<Diagram> {
  const supabase = createClient()
  const { data } = await supabase
    .from('diagrams')
    .select('id, nodes, edges')
    .eq('project_id', projectId)
    .single()

  if (!data) return { id: null, nodes: [], edges: [] }

  return {
    id: data.id as string,
    nodes: (data.nodes as DiagramNode[]) ?? [],
    edges: (data.edges as DiagramEdge[]) ?? [],
  }
}

export async function saveDiagram(
  projectId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[]
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('diagrams')
    .upsert({ project_id: projectId, nodes, edges }, { onConflict: 'project_id' })
}
