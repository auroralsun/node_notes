import { prisma } from '@/lib/prisma'
import { templateSchema } from '@/lib/templates'
import { errorResponse, jsonResponse } from '@/lib/api'

export async function GET() {
  const items = await prisma.relationTypeTemplate.findMany({
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

  const exists = await prisma.relationTypeTemplate.findUnique({
    where: { name: parsed.data.name }
  })

  if (exists) {
    return errorResponse('同名关系模板已存在')
  }

  const item = await prisma.relationTypeTemplate.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      schemaJson: parsed.data.schemaJson
    }
  })

  return jsonResponse(item, { status: 201 })
}
