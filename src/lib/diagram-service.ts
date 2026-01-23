import { supabase } from './supabase'

export type Diagram = {
  id?: string
  userId?: string
  title?: string
  nodes: any
  edges: any
  createdAt?: string
  updatedAt?: string
}

export async function saveDiagram(diagram: Diagram): Promise<{ data?: Diagram; error?: any }> {
  const payload = {
    user_id: diagram.userId,
    title: diagram.title || null,
    nodes: diagram.nodes,
    edges: diagram.edges,
  }

  try {
    if (diagram.id) {
      const { data, error } = await (supabase as any)
        .from('diagrams')
        .update({ ...payload })
        .eq('id', diagram.id)
        .select('*')
        .single()

      return { data: data as unknown as Diagram, error }
    }

    const { data, error } = await (supabase as any).from('diagrams').insert({ ...payload }).select('*').single()
    return { data: data as unknown as Diagram, error }
  } catch (err) {
    return { error: err }
  }
}

export async function listDiagrams(userId: string): Promise<{ data?: Array<{ id: string; title?: string; created_at: string; updated_at: string }>; error?: any }> {
  const { data, error } = await (supabase as any)
    .from('diagrams')
    .select('id,title,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  return { data: data as any, error }
}

export async function loadDiagram(id: string): Promise<{ data?: Diagram; error?: any }> {
  const { data, error } = await (supabase as any).from('diagrams').select('id,title,nodes,edges,created_at,updated_at').eq('id', id).single()
  if (error) return { error }
  const row = data as any
  return {
    data: {
      id: row.id,
      title: row.title,
      nodes: row.nodes,
      edges: row.edges,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  }
}

export async function deleteDiagram(id: string): Promise<{ error?: any }> {
  const { error } = await (supabase as any).from('diagrams').delete().eq('id', id)
  return { error }
}
