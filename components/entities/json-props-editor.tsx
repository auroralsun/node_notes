'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type JsonValue = string | number | boolean | null

type JsonPropsEditorProps = {
  entityId: string
  initialValue: Record<string, JsonValue>
}

type Row = {
  id: string
  key: string
  type: 'string' | 'number' | 'boolean'
  value: string
}

function inferType(value: unknown): Row['type'] {
  if (typeof value === 'number') {
    return 'number'
  }
  if (typeof value === 'boolean') {
    return 'boolean'
  }
  return 'string'
}

function serializeRows(rows: Row[]) {
  return rows.reduce<Record<string, JsonValue>>((accumulator, row) => {
    if (!row.key.trim()) {
      return accumulator
    }

    if (row.type === 'number') {
      accumulator[row.key.trim()] = row.value === '' ? 0 : Number(row.value)
      return accumulator
    }

    if (row.type === 'boolean') {
      accumulator[row.key.trim()] = row.value === 'true'
      return accumulator
    }

    accumulator[row.key.trim()] = row.value
    return accumulator
  }, {})
}

export function JsonPropsEditor({ entityId, initialValue }: JsonPropsEditorProps) {
  const router = useRouter()
  const initialRows = useMemo<Row[]>(() => {
    const entries = Object.entries(initialValue)
    if (!entries.length) {
      return [{ id: crypto.randomUUID(), key: '', type: 'string', value: '' }]
    }

    return entries.map(([key, value]) => ({
      id: crypto.randomUUID(),
      key,
      type: inferType(value),
      value: String(value ?? '')
    }))
  }, [initialValue])

  const [rows, setRows] = useState<Row[]>(initialRows)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateRow(id: string, field: keyof Row, value: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setRows((current) => [...current, { id: crypto.randomUUID(), key: '', type: 'string', value: '' }])
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const response = await fetch(`/api/entities/${entityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ propsJson: serializeRows(rows) })
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? '保存属性失败')
      setSaving(false)
      return
    }

    router.refresh()
    setSaving(false)
  }

  return (
    <div className="form-grid">
      <div className="field-group-head">
        <div>
          <div className="field-group-title">结构化属性</div>
          <div className="field-group-desc">保持轻量，但比纯文本更适合后续检索与模板化演进。</div>
        </div>
        <span className="badge">{rows.length} 项</span>
      </div>

      {rows.map((row, index) => (
        <div className="property-row" key={row.id}>
          <div className="property-row-head">
            <span className="badge">属性 {index + 1}</span>
            <button className="button ghost" onClick={() => removeRow(row.id)} type="button">
              删除
            </button>
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label className="label">属性名</label>
              <input className="input" value={row.key} onChange={(event) => updateRow(row.id, 'key', event.target.value)} placeholder="例如：来源 / 可信度 / 优先级" />
            </div>
            <div className="field">
              <label className="label">类型</label>
              <select className="select" value={row.type} onChange={(event) => updateRow(row.id, 'type', event.target.value)}>
                <option value="string">文本</option>
                <option value="number">数字</option>
                <option value="boolean">布尔</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label className="label">属性值</label>
            {row.type === 'boolean' ? (
              <select className="select" value={row.value} onChange={(event) => updateRow(row.id, 'value', event.target.value)}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <input className="input" value={row.value} onChange={(event) => updateRow(row.id, 'value', event.target.value)} placeholder="输入属性值" />
            )}
          </div>
        </div>
      ))}

      {error ? <div className="notice danger">{error}</div> : null}

      <div className="actions">
        <button className="button secondary" onClick={addRow} type="button">
          新增属性
        </button>
        <button className="button" disabled={saving} onClick={handleSave} type="button">
          {saving ? '保存中...' : '保存属性'}
        </button>
      </div>
    </div>
  )
}
