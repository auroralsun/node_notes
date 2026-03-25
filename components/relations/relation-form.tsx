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
      setError(data?.error ?? '创建关系失败。')
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
            <div className="field-group-title">模板与语义</div>
            <div className="field-group-desc">先选择模板，再设置源实体、目标实体和关系类型。</div>
          </div>
          <span className="badge">{templates.length} 个模板</span>
        </div>

        <div className="field">
          <label className="label">关系模板</label>
          <select className="select" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            <option value="">不使用模板</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        {selectedTemplate ? <div className="helper-text">已选模板：{selectedTemplate.name}</div> : null}
      </div>

      <div className="field-group">
        <div className="field-group-head">
          <div>
            <div className="field-group-title">连接实体</div>
            <div className="field-group-desc">为关系明确指定源实体与目标实体。</div>
          </div>
        </div>

        <div className="field">
          <label className="label">源实体</label>
          <select className="select" value={fromEntityId} onChange={(event) => setFromEntityId(event.target.value)}>
            <option value="">请选择实体</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name} · {entity.type}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">关系类型</label>
          <input className="input" value={relationType} onChange={(event) => setRelationType(event.target.value)} placeholder="例如：引用 / 依赖于 / 导致" />
        </div>

        <div className="field">
          <label className="label">目标实体</label>
          <select className="select" value={toEntityId} onChange={(event) => setToEntityId(event.target.value)}>
            <option value="">请选择实体</option>
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
          {saving ? '创建中...' : '创建关系'}
        </button>
      </div>
    </form>
  )
}
