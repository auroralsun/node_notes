'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { GraphCanvas } from '@/components/graph/graph-canvas'

type GraphNode = {
  id: string
  name: string
  type: string
  summary: string | null
}

type GraphEdge = {
  id: string
  source: string
  target: string
  label: string
}

type GraphPayload = {
  focusEntityId: string
  depth: number
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type LocalGraphProps = {
  entityId: string
}

export function LocalGraph({ entityId }: LocalGraphProps) {
  const [depth, setDepth] = useState(1)
  const [data, setData] = useState<GraphPayload | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const nodeMap = useMemo(() => new Map((data?.nodes ?? []).map((node) => [node.id, node])), [data])

  useEffect(() => {
    let cancelled = false

    async function loadGraph() {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/graph?entityId=${entityId}&depth=${depth}`)
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        if (!cancelled) {
          setError(payload?.error ?? '图谱加载失败')
          setLoading(false)
        }
        return
      }

      const payload = (await response.json()) as GraphPayload
      if (!cancelled) {
        setData(payload)
        setLoading(false)
      }
    }

    loadGraph()

    return () => {
      cancelled = true
    }
  }, [depth, entityId])

  if (loading) {
    return <div className="empty">图谱加载中...</div>
  }

  if (error) {
    return <div className="notice danger">{error}</div>
  }

  return (
    <div className="form-grid">
      <div className="field-group-head">
        <div>
          <div className="field-group-title">局部图谱视图</div>
          <div className="field-group-desc">围绕当前实体按 1 到 3 跳展开，让知识网络保持可读，不陷入全局噪音。</div>
        </div>
        <span className="badge success">{data?.nodes.length ?? 0} 个节点</span>
      </div>

      <div className="actions">
        <button className={depth === 1 ? 'button' : 'button secondary'} onClick={() => setDepth(1)} type="button">一跳</button>
        <button className={depth === 2 ? 'button' : 'button secondary'} onClick={() => setDepth(2)} type="button">二跳</button>
        <button className={depth === 3 ? 'button' : 'button secondary'} onClick={() => setDepth(3)} type="button">三跳</button>
      </div>

      <GraphCanvas focusEntityId={data?.focusEntityId ?? entityId} nodes={data?.nodes ?? []} edges={data?.edges ?? []} />

      <div className="card soft">
        <div className="field-group-head">
          <div>
            <div className="field-group-title">关系明细</div>
            <div className="field-group-desc">图中所有边在这里以结构化清单形式列出。</div>
          </div>
          <span className="badge">{data?.edges.length ?? 0} 条边</span>
        </div>
        {data?.edges.length ? (
          <div className="entity-list">
            {data.edges.map((edge) => (
              <div className="entity-item" key={edge.id}>
                <div className="entity-item-summary">
                  <Link className="link" href={`/entities/${edge.source}`}>{nodeMap.get(edge.source)?.name ?? edge.source}</Link>
                  {' '}→ <span className="badge">{edge.label}</span> →{' '}
                  <Link className="link" href={`/entities/${edge.target}`}>{nodeMap.get(edge.target)?.name ?? edge.target}</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">当前范围内没有关联关系。</div>
        )}
      </div>
    </div>
  )
}
