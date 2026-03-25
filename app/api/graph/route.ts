import { prisma } from '@/lib/prisma'
import { errorResponse, jsonResponse } from '@/lib/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get('entityId')?.trim()
  const depth = Number(searchParams.get('depth') ?? '1')

  if (!entityId) {
    return errorResponse('entityId 必填')
  }

  const entity = await prisma.entity.findUnique({ where: { id: entityId } })
  if (!entity) {
    return errorResponse('实体不存在', 404)
  }

  const maxDepth = Math.max(1, Math.min(Number.isFinite(depth) ? depth : 1, 3))
  const visited = new Set<string>()
  const nodes = new Map<string, { id: string; name: string; type: string; summary: string | null }>()
  const edges = new Map<string, { id: string; source: string; target: string; label: string; propsJson: unknown }>()

  let currentLevel = [entityId]
  let currentDepth = 0

  while (currentLevel.length && currentDepth < maxDepth) {
    const batch = currentLevel.filter((id) => !visited.has(id))
    if (!batch.length) {
      break
    }

    batch.forEach((id) => visited.add(id))

    const relations = await prisma.relation.findMany({
      where: {
        OR: [{ fromEntityId: { in: batch } }, { toEntityId: { in: batch } }]
      },
      include: {
        fromEntity: true,
        toEntity: true
      }
    })

    const nextLevel = new Set<string>()

    for (const relation of relations) {
      nodes.set(relation.fromEntity.id, {
        id: relation.fromEntity.id,
        name: relation.fromEntity.name,
        type: relation.fromEntity.type,
        summary: relation.fromEntity.summary
      })
      nodes.set(relation.toEntity.id, {
        id: relation.toEntity.id,
        name: relation.toEntity.name,
        type: relation.toEntity.type,
        summary: relation.toEntity.summary
      })
      edges.set(relation.id, {
        id: relation.id,
        source: relation.fromEntityId,
        target: relation.toEntityId,
        label: relation.relationType,
        propsJson: relation.propsJson
      })

      if (!visited.has(relation.fromEntityId)) {
        nextLevel.add(relation.fromEntityId)
      }
      if (!visited.has(relation.toEntityId)) {
        nextLevel.add(relation.toEntityId)
      }
    }

    currentLevel = [...nextLevel]
    currentDepth += 1
  }

  nodes.set(entity.id, {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    summary: entity.summary
  })

  return jsonResponse({
    focusEntityId: entityId,
    depth: maxDepth,
    nodes: [...nodes.values()],
    edges: [...edges.values()]
  })
}
