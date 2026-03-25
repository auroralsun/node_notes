import { GraphCanvas } from '@/components/graph/graph-canvas'
import { prisma } from '@/lib/prisma'

export const revalidate = 30

export default async function HomePage() {
  const recentNotes = await prisma.entity.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    take: 12,
    select: {
      id: true,
      name: true,
      type: true,
      summary: true,
      updatedAt: true,
      outgoingRelations: {
        include: {
          toEntity: true
        }
      }
    }
  })

  const recentIds = new Set(recentNotes.map((note) => note.id))
  const nodes = recentNotes.map((note) => ({
    id: note.id,
    name: note.name,
    type: note.type,
    summary: note.summary
  }))
  const edgeMap = new Map<string, { id: string; source: string; target: string; label: string }>()

  for (const note of recentNotes) {
    for (const relation of note.outgoingRelations) {
      if (recentIds.has(relation.toEntity.id)) {
        edgeMap.set(relation.id, {
          id: relation.id,
          source: note.id,
          target: relation.toEntity.id,
          label: relation.relationType
        })
      }
    }
  }

  return (
    <main className="home-graph-only">
      {recentNotes.length ? (
        <GraphCanvas focusEntityId={recentNotes[0].id} nodes={nodes} edges={[...edgeMap.values()]} minimal />
      ) : (
        <div className="empty home-empty">暂无最近笔记。</div>
      )}
    </main>
  )
}
