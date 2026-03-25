export type JsonScalar = string | number | boolean | null

export type EntityTemplateField = {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean'
  required?: boolean
}
