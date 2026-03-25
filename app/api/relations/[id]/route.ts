import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { relationUpdateSchema } from '@/lib/relations'
import { errorResponse, jsonResponse } from '@/lib/api'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: Params) {
  const { id } = await params

  const relation = await prisma.relation.findUnique({
    where: { id },
    include: {
      fromEntity: true,
      toEntity: true
    }
  })

  if (!relation) {
    return errorResponse('Relation not found.', 404)
  }

  return jsonResponse(relation)
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const parsed = relationUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid request.')
  }

  const existing = await prisma.relation.findUnique({ where: { id } })
  if (!existing) {
    return errorResponse('Relation not found.', 404)
  }

  const relation = await prisma.relation.update({
    where: { id },
    data: {
      ...(parsed.data.relationType !== undefined ? { relationType: parsed.data.relationType } : {}),
      ...(parsed.data.propsJson !== undefined ? { propsJson: parsed.data.propsJson as Prisma.InputJsonObject } : {})
    },
    include: {
      fromEntity: true,
      toEntity: true
    }
  })

  revalidatePath('/')
  revalidatePath('/entities')
  revalidatePath('/relations')

  return jsonResponse(relation)
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params

  const existing = await prisma.relation.findUnique({ where: { id } })
  if (!existing) {
    return errorResponse('Relation not found.', 404)
  }

  await prisma.relation.delete({ where: { id } })

  revalidatePath('/')
  revalidatePath('/entities')
  revalidatePath('/relations')

  return new Response(null, { status: 204 })
}
