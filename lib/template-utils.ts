import type { EntityTemplateField } from '@/app/types'

export function coerceTemplateDefaults(fields: EntityTemplateField[]) {
  return fields.reduce<Record<string, string | number | boolean | null>>((accumulator, field) => {
    if (field.type === 'number') {
      accumulator[field.key] = 0
      return accumulator
    }

    if (field.type === 'boolean') {
      accumulator[field.key] = false
      return accumulator
    }

    accumulator[field.key] = ''
    return accumulator
  }, {})
}
