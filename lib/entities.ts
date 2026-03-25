import { z } from 'zod'

const jsonScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

export const entitySchema = z.object({
  name: z.string().trim().min(1, 'Note name is required.').max(120, 'Note name is too long.'),
  type: z.string().trim().min(1, 'Note type is required.').max(60, 'Note type is too long.'),
  summary: z.string().trim().max(500, 'Summary is too long.').optional().or(z.literal('')),
  propsJson: z.record(z.string(), jsonScalarSchema).optional()
})

export const entityUpdateSchema = entitySchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be updated.'
})

export type EntityInput = z.infer<typeof entitySchema>
export type EntityUpdateInput = z.infer<typeof entityUpdateSchema>
