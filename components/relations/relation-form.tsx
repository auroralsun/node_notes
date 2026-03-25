'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import type { EntityTemplateField } from '@/app/types'
import { coerceTemplateDefaults } from '@/lib/template-utils'

type EntityOption = {
  id: string
  name: string
  type: string
}

type TemplateOption = {
  id: string
  name: string
  schemaJson: EntityTemplateField[]
}

type RelationFormProps = {
  entities: EntityOption[]
  focusEntityId?: string
  templates?: TemplateOption[]
}

export function RelationForm({ entities, focusEntityId, templates = [] }: RelationFormProps) {
  const router = useRouter()
  const [fromEntityId, setFromEntityId] = useState(focusEntityId ?? entities[0]?.id ?? '')
  const [toEntityId, setToEntityId] = useState('')
  const [relationType, setRelationType] = useState('belongs_to')
  const [templateId, setTemplateId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedTemplate = useMemo(() => templates.find((item) => item.id === templateId), [templateId, templates])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const response = await fetch('/api/relations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromEntityId,
        toEntityId,
        relationType,
        ...(selectedTemplate ? { propsJson: coerceTemplateDefaults(selectedTemplate.schemaJson) } : {})
      })
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? 'Failed to create relation.')
      setSaving(false)
      return
    }

    setToEntityId('')
    router.refresh()
    setSaving(false)
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field-group">
        <div className="field-group-head">
          <div>
            <div className="field-group-title">Template and semantics</div>
            <div className="field-group-desc">Choose a template first, then connect source, target, and relation type.</div>
          </div>
          <span className="badge">{templates.length} templates</span>
        </div>

        <div className="field">
          <label className="label">Relation template</label>
          <select className="select" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            <option value="">No template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        {selectedTemplate ? <div className="helper-text">Selected template: {selectedTemplate.name}</div> : null}
      </div>

      <div className="field-group">
        <div className="field-group-head">
          <div>
            <div className="field-group-title">Connected entities</div>
            <div className="field-group-desc">Attach the semantic relation to explicit source and target notes.</div>
          </div>
        </div>

        <div className="field">
          <label className="label">Source entity</label>
          <select className="select" value={fromEntityId} onChange={(event) => setFromEntityId(event.target.value)}>
            <option value="">Choose an entity</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name} · {entity.type}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Relation type</label>
          <input className="input" value={relationType} onChange={(event) => setRelationType(event.target.value)} placeholder="e.g. references / depends_on / causes" />
        </div>

        <div className="field">
          <label className="label">Target entity</label>
          <select className="select" value={toEntityId} onChange={(event) => setToEntityId(event.target.value)}>
            <option value="">Choose an entity</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name} · {entity.type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="notice danger">{error}</div> : null}

      <div className="actions">
        <button className="button" disabled={saving} type="submit">
          {saving ? 'Creating...' : 'Create relation'}
        </button>
      </div>
    </form>
  )
}
