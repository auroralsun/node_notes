import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { entityUpdateSchema } from '@/lib/entities'
import { errorResponse, jsonResponse } from '@/lib/api'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: Params) {
  const { id } = await params

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: {
      outgoingRelations: {
        include: {
          toEntity: true
        },
        orderBy: { updatedAt: 'desc' }
      },
      incomingRelations: {
        include: {
          fromEntity: true
        },
        orderBy: { updatedAt: 'desc' }
      }
    }
  })

  if (!entity) {
    return errorResponse('Note not found.', 404)
  }

  return jsonResponse(entity)
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const parsed = entityUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid request.')
  }

  const existing = await prisma.entity.findUnique({ where: { id } })
  if (!existing) {
    return errorResponse('Note not found.', 404)
  }

  const entity = await prisma.entity.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
      ...(parsed.data.summary !== undefined ? { summary: parsed.data.summary || null } : {}),
      ...(parsed.data.propsJson !== undefined ? { propsJson: parsed.data.propsJson as Prisma.InputJsonObject } : {})
    }
  })

  revalidatePath('/')
  revalidatePath('/entities')
  revalidatePath('/relations')

  return jsonResponse(entity)
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params

  const existing = await prisma.entity.findUnique({ where: { id } })
  if (!existing) {
    return errorResponse('Note not found.', 404)
  }

  await prisma.entity.delete({ where: { id } })

  revalidatePath('/')
  revalidatePath('/entities')
  revalidatePath('/relations')

  return new Response(null, { status: 204 })
}
