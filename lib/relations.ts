import { z } from 'zod'

const jsonScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

export const relationSchema = z.object({
  fromEntityId: z.string().trim().min(1, '源笔记必填。'),
  toEntityId: z.string().trim().min(1, '目标笔记必填。'),
  relationType: z.string().trim().min(1, '关系名称必填。').max(60, '关系名称过长。'),
  propsJson: z.record(z.string(), jsonScalarSchema).optional()
})

export const relationUpdateSchema = z
  .object({
    relationType: z.string().trim().min(1, '关系名称必填。').max(60, '关系名称过长。').optional(),
    propsJson: z.record(z.string(), jsonScalarSchema).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: '至少更新一个字段。'
  })
