import { prisma } from '@/lib/prisma'
import { templateSchema } from '@/lib/templates'
import { errorResponse, jsonResponse } from '@/lib/api'

export async function GET() {
  const items = await prisma.entityTypeTemplate.findMany({
    orderBy: [{ updatedAt: 'desc' }]
  })

  return jsonResponse({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = templateSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '参数错误')
  }

  const exists = await prisma.entityTypeTemplate.findUnique({
    where: { name: parsed.data.name }
  })

  if (exists) {
    return errorResponse('同名实体模板已存在')
  }

  const item = await prisma.entityTypeTemplate.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      schemaJson: parsed.data.schemaJson
    }
  })

  return jsonResponse(item, { status: 201 })
}
