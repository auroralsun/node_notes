import { z } from 'zod'

const jsonScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

export const relationSchema = z.object({
  fromEntityId: z.string().trim().min(1, 'Source note is required.'),
  toEntityId: z.string().trim().min(1, 'Target note is required.'),
  relationType: z.string().trim().min(1, 'Relation name is required.').max(60, 'Relation name is too long.'),
  propsJson: z.record(z.string(), jsonScalarSchema).optional()
})

export const relationUpdateSchema = z
  .object({
    relationType: z.string().trim().min(1, 'Relation name is required.').max(60, 'Relation name is too long.').optional(),
    propsJson: z.record(z.string(), jsonScalarSchema).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be updated.'
  })
