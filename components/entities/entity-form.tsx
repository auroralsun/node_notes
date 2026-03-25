'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import type { EntityTemplateField } from '@/app/types'
import { coerceTemplateDefaults } from '@/lib/template-utils'

type TemplateOption = {
  id: string
  name: string
  schemaJson: EntityTemplateField[]
}

type EntityFormProps = {
  mode: 'create' | 'edit'
  initialValue?: {
    id?: string
    name?: string
    type?: string
    summary?: string | null
  }
  templates?: TemplateOption[]
}

export function EntityForm({ mode, initialValue, templates = [] }: EntityFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialValue?.name ?? '')
  const [type, setType] = useState(initialValue?.type ?? '')
  const [summary, setSummary] = useState(initialValue?.summary ?? '')
  const [templateId, setTemplateId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submitLabel = useMemo(() => (mode === 'create' ? '创建笔记' : '保存笔记'), [mode])
  const selectedTemplate = templates.find((item) => item.id === templateId)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const endpoint = mode === 'create' ? '/api/entities' : `/api/entities/${initialValue?.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        type,
        summary,
        ...(mode === 'create' && selectedTemplate
          ? { propsJson: coerceTemplateDefaults(selectedTemplate.schemaJson) }
          : {})
      })
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? '保存失败')
      setSaving(false)
      return
    }

    const entity = (await response.json().catch(() => null)) as { id?: string } | null

    if (mode === 'create' && entity?.id) {
      router.push(`/entities/${entity.id}`)
      router.refresh()
      return
    }

    router.refresh()
    setSaving(false)
  }

  async function handleDelete() {
    if (mode !== 'edit' || !initialValue?.id) {
      return
    }

    const confirmed = window.confirm('确认删除这条笔记？')
    if (!confirmed) {
      return
    }

    setSaving(true)
    setError('')

    const response = await fetch(`/api/entities/${initialValue.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? '删除失败')
      setSaving(false)
      return
    }

    router.push('/entities')
    router.refresh()
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {mode === 'create' ? (
        <div className="field-group">
          <div className="field-group-head">
            <div>
              <div className="field-group-title">模板预设</div>
              <div className="field-group-desc">可选一套模板，帮你带出默认结构，但入口仍然先像写笔记。</div>
            </div>
            <span className="badge">{templates.length} 个模板</span>
          </div>
          <div className="field">
            <label className="label" htmlFor="templateId">
              笔记模板
            </label>
            <select id="templateId" className="select" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              <option value="">不使用模板</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          {selectedTemplate ? <div className="helper-text">已选择模板：{selectedTemplate.name}</div> : null}
        </div>
      ) : null}

      <div className="field-group">
        <div className="field-group-head">
          <div>
            <div className="field-group-title">笔记内容</div>
            <div className="field-group-desc">先把它当成一条笔记来写，再逐步补充类型、连接和属性。</div>
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="name">
            标题
          </label>
          <input id="name" className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：机器学习" />
        </div>

        <div className="field">
          <label className="label" htmlFor="summary">
            摘要
          </label>
          <textarea id="summary" className="textarea" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="先写一句摘要或内容提要。" />
        </div>

        <div className="field">
          <label className="label" htmlFor="type">
            笔记类型
          </label>
          <input id="type" className="input" value={type} onChange={(event) => setType(event.target.value)} placeholder="例如：概念 / 人物 / 项目 / 资料" />
        </div>
      </div>

      {error ? <div className="notice danger">{error}</div> : null}

      <div className="actions">
        <button className="button" disabled={saving} type="submit">
          {saving ? '处理中...' : submitLabel}
        </button>
        {mode === 'edit' ? (
          <button className="button danger" disabled={saving} onClick={handleDelete} type="button">
            删除笔记
          </button>
        ) : null}
      </div>
    </form>
  )
}
