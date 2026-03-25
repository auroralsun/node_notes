import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { relationSchema } from '@/lib/relations'
import { errorResponse, jsonResponse } from '@/lib/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get('entityId')?.trim()

  const relations = await prisma.relation.findMany({
    where: entityId
      ? {
          OR: [{ fromEntityId: entityId }, { toEntityId: entityId }]
        }
      : undefined,
    include: {
      fromEntity: true,
      toEntity: true
    },
    orderBy: [{ updatedAt: 'desc' }]
  })

  return jsonResponse({ items: relations })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = relationSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid request.')
  }

  if (parsed.data.fromEntityId === parsed.data.toEntityId) {
    return errorResponse('Source and target notes must be different.')
  }

  const [fromEntity, toEntity] = await Promise.all([
    prisma.entity.findUnique({ where: { id: parsed.data.fromEntityId } }),
    prisma.entity.findUnique({ where: { id: parsed.data.toEntityId } })
  ])

  if (!fromEntity || !toEntity) {
    return errorResponse('One or more notes do not exist.', 404)
  }

  const relation = await prisma.relation.create({
    data: {
      fromEntityId: parsed.data.fromEntityId,
      toEntityId: parsed.data.toEntityId,
      relationType: parsed.data.relationType,
      propsJson: (parsed.data.propsJson ?? {}) as Prisma.InputJsonObject
    },
    include: {
      fromEntity: true,
      toEntity: true
    }
  })

  revalidatePath('/')
  revalidatePath('/entities')
  revalidatePath('/relations')

  return jsonResponse(relation, { status: 201 })
}
