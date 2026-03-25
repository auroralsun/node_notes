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
          <div className="field-group-title">Filter relations</div>
          <div className="field-group-desc">Quickly narrow the graph by relation type or by connected entity name.</div>
        </div>
        <span className="badge">Filter</span>
      </div>
      <div className="grid grid-2">
        <div className="field">
          <label className="label">Relation type</label>
          <input className="input" value={relationType} onChange={(event) => setRelationType(event.target.value)} placeholder="e.g. belongs_to" />
        </div>
        <div className="field">
          <label className="label">Entity name</label>
          <input className="input" value={entityName} onChange={(event) => setEntityName(event.target.value)} placeholder="Search source or target entity" />
        </div>
      </div>
      <div className="actions">
        <button className="button" type="submit">Apply filter</button>
        <button className="button secondary" onClick={() => router.push('/relations' as Route)} type="button">Reset</button>
      </div>
    </form>
  )
}
