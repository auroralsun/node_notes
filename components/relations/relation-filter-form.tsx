'use client'

import type { Route } from 'next'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

export function RelationFilterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [relationType, setRelationType] = useState(searchParams.get('relationType') ?? '')
  const [entityName, setEntityName] = useState(searchParams.get('entityName') ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams()
    if (relationType.trim()) {
      params.set('relationType', relationType.trim())
    }
    if (entityName.trim()) {
      params.set('entityName', entityName.trim())
    }

    const target = params.toString() ? (`/relations?${params.toString()}` as Route) : ('/relations' as Route)
    router.push(target)
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <div className="field-group-head">
        <div>
          <div className="field-group-title">筛选关系</div>
          <div className="field-group-desc">按关系类型或关联实体名快速缩小范围。</div>
        </div>
        <span className="badge">筛选</span>
      </div>
      <div className="grid grid-2">
        <div className="field">
          <label className="label">关系类型</label>
          <input className="input" value={relationType} onChange={(event) => setRelationType(event.target.value)} placeholder="例如：belongs_to" />
        </div>
        <div className="field">
          <label className="label">实体名称</label>
          <input className="input" value={entityName} onChange={(event) => setEntityName(event.target.value)} placeholder="搜索源实体或目标实体" />
        </div>
      </div>
      <div className="actions">
        <button className="button" type="submit">应用筛选</button>
        <button className="button secondary" onClick={() => router.push('/relations' as Route)} type="button">重置</button>
      </div>
    </form>
  )
}
