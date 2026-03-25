import { z } from 'zod'

const templateFieldSchema = z.object({
  key: z.string().trim().min(1, '字段名必填').max(60, '字段名过长'),
  label: z.string().trim().min(1, '字段标题必填').max(60, '字段标题过长'),
  type: z.enum(['string', 'number', 'boolean']),
  required: z.boolean().optional()
})

export const templateSchema = z.object({
  name: z.string().trim().min(1, '模板名必填').max(60, '模板名过长'),
  description: z.string().trim().max(200, '模板描述过长').optional().or(z.literal('')),
  schemaJson: z.array(templateFieldSchema).default([])
})

export const templateUpdateSchema = templateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: '至少提交一个字段'
})

export type TemplateField = z.infer<typeof templateFieldSchema>
