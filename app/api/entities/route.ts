import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { entitySchema } from '@/lib/entities'
import { errorResponse, jsonResponse } from '@/lib/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const type = searchParams.get('type')?.trim()

  const entities = await prisma.entity.findMany({
    where: {
      ...(query
        ? {
            OR: [{ name: { contains: query } }, { summary: { contains: query } }]
          }
        : {}),
      ...(type ? { type } : {})
    },
    orderBy: [{ updatedAt: 'desc' }]
  })

  return jsonResponse({ items: entities })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = entitySchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid request.')
  }

  const entity = await prisma.entity.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      summary: parsed.data.summary || null,
      propsJson: (parsed.data.propsJson ?? {}) as Prisma.InputJsonObject
    }
  })

  revalidatePath('/')
  revalidatePath('/entities')
  revalidatePath('/relations')

  return jsonResponse(entity, { status: 201 })
}
