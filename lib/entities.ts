import { z } from 'zod'

const jsonScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

export const entitySchema = z.object({
  name: z.string().trim().min(1, '笔记名称必填。').max(120, '笔记名称过长。'),
  type: z.string().trim().min(1, '笔记类型必填。').max(60, '笔记类型过长。'),
  summary: z.string().trim().max(500, '摘要过长。').optional().or(z.literal('')),
  propsJson: z.record(z.string(), jsonScalarSchema).optional()
})

export const entityUpdateSchema = entitySchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: '至少更新一个字段。'
})

export type EntityInput = z.infer<typeof entitySchema>
export type EntityUpdateInput = z.infer<typeof entityUpdateSchema>
