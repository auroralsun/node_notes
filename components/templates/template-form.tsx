'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

type FieldRow = {
  id: string
  key: string
  label: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
}

type TemplateFormProps = {
  mode: 'entity' | 'relation'
}

export function TemplateForm({ mode }: TemplateFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FieldRow[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addField() {
    setFields((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        key: '',
        label: '',
        type: 'string',
        required: false
      }
    ])
  }

  function updateField(id: string, patch: Partial<FieldRow>) {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)))
  }

  function removeField(id: string) {
    setFields((current) => current.filter((field) => field.id !== id))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const endpoint = mode === 'entity' ? '/api/templates/entity-types' : '/api/templates/relation-types'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        schemaJson: fields.map(({ id, ...field }) => field)
      })
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setError(payload?.error ?? 'Failed to save template.')
      setSaving(false)
      return
    }

    setName('')
    setDescription('')
    setFields([])
    router.refresh()
    setSaving(false)
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field-group">
        <div className="field-group-head">
          <div>
            <div className="field-group-title">Template definition</div>
            <div className="field-group-desc">Define a reusable structure, then apply it to notes or relations later.</div>
          </div>
          <span className="badge">{mode === 'entity' ? 'Entity' : 'Relation'}</span>
        </div>

        <div className="field">
          <label className="label">Template name</label>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={mode === 'entity' ? 'e.g. Concept note' : 'e.g. Causal relation'}
          />
        </div>

        <div className="field">
          <label className="label">Description</label>
          <textarea
            className="textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe when this template should be used."
          />
        </div>
      </div>

      <div className="field-group-head">
        <div>
          <div className="field-group-title">Schema fields</div>
          <div className="field-group-desc">Capture the reusable fields that should appear every time.</div>
        </div>
        <button className="button secondary" onClick={addField} type="button">Add field</button>
      </div>

      {fields.map((field, index) => (
        <div className="property-row" key={field.id}>
          <div className="property-row-head">
            <span className="badge">Field {index + 1}</span>
            <button className="button danger" onClick={() => removeField(field.id)} type="button">Delete field</button>
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label className="label">Field key</label>
              <input className="input" value={field.key} onChange={(event) => updateField(field.id, { key: event.target.value })} placeholder="e.g. source" />
            </div>
            <div className="field">
              <label className="label">Label</label>
              <input className="input" value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} placeholder="e.g. Source" />
            </div>
            <div className="field">
              <label className="label">Type</label>
              <select className="select" value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as FieldRow['type'] })}>
                <option value="string">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Required</label>
              <select className="select" value={String(field.required)} onChange={(event) => updateField(field.id, { required: event.target.value === 'true' })}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {error ? <div className="notice danger">{error}</div> : null}

      <div className="actions">
        <button className="button" disabled={saving} type="submit">
          {saving ? 'Saving...' : 'Save template'}
        </button>
      </div>
    </form>
  )
}
