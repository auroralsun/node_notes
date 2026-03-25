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
      setError(payload?.error ?? '保存模板失败。')
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
            <div className="field-group-title">模板定义</div>
            <div className="field-group-desc">先定义可复用结构，再应用到笔记或关系。</div>
          </div>
          <span className="badge">{mode === 'entity' ? '实体' : '关系'}</span>
        </div>

        <div className="field">
          <label className="label">模板名称</label>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={mode === 'entity' ? '例如：概念笔记' : '例如：因果关系'}
          />
        </div>

        <div className="field">
          <label className="label">描述</label>
          <textarea
            className="textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="说明这个模板适用于什么场景。"
          />
        </div>
      </div>

      <div className="field-group-head">
        <div>
          <div className="field-group-title">Schema 字段</div>
          <div className="field-group-desc">定义每次都需要出现的可复用字段。</div>
        </div>
        <button className="button secondary" onClick={addField} type="button">新增字段</button>
      </div>

      {fields.map((field, index) => (
        <div className="property-row" key={field.id}>
          <div className="property-row-head">
            <span className="badge">字段 {index + 1}</span>
            <button className="button danger" onClick={() => removeField(field.id)} type="button">删除字段</button>
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label className="label">字段 key</label>
              <input className="input" value={field.key} onChange={(event) => updateField(field.id, { key: event.target.value })} placeholder="例如：source" />
            </div>
            <div className="field">
              <label className="label">显示名</label>
              <input className="input" value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} placeholder="例如：来源" />
            </div>
            <div className="field">
              <label className="label">类型</label>
              <select className="select" value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as FieldRow['type'] })}>
                <option value="string">文本</option>
                <option value="number">数字</option>
                <option value="boolean">布尔</option>
              </select>
            </div>
            <div className="field">
              <label className="label">必填</label>
              <select className="select" value={String(field.required)} onChange={(event) => updateField(field.id, { required: event.target.value === 'true' })}>
                <option value="false">否</option>
                <option value="true">是</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {error ? <div className="notice danger">{error}</div> : null}

      <div className="actions">
        <button className="button" disabled={saving} type="submit">
          {saving ? '保存中...' : '保存模板'}
        </button>
      </div>
    </form>
  )
}
