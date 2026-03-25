'use client'

import type { Route } from 'next'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

export function EntitySearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [type, setType] = useState(searchParams.get('type') ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    if (type.trim()) {
      params.set('type', type.trim())
    }

    const target = params.toString() ? (`/entities?${params.toString()}` as Route) : ('/entities' as Route)
    router.push(target)
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <div className="field-group-head">
        <div>
          <div className="field-group-title">搜索笔记</div>
          <div className="field-group-desc">按标题、摘要、类型快速过滤当前笔记列表。</div>
        </div>
        <span className="badge">Search</span>
      </div>

      <div className="grid grid-2">
        <div className="field">
          <label className="label" htmlFor="search-query">
            关键词
          </label>
          <input
            id="search-query"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="按标题或摘要搜索"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="search-type">
            笔记类型
          </label>
          <input
            id="search-type"
            className="input"
            value={type}
            onChange={(event) => setType(event.target.value)}
            placeholder="例如：概念"
          />
        </div>
      </div>

      <div className="actions">
        <button className="button" type="submit">
          搜索
        </button>
        <button className="button secondary" onClick={() => router.push('/entities' as Route)} type="button">
          重置
        </button>
      </div>
    </form>
  )
}
