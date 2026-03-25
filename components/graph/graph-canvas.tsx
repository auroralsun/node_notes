'use client'

import Link from 'next/link'

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

type GraphCanvasProps = {
  focusEntityId: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  minimal?: boolean
}

export function GraphCanvas({ focusEntityId, nodes, edges, minimal = false }: GraphCanvasProps) {
  const width = 860
  const height = minimal ? 720 : 560
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(minimal ? 240 : 200, 120 + nodes.length * 8)

  const outerNodes = nodes.filter((node) => node.id !== focusEntityId)
  const positionedNodes = nodes.map((node) => {
    if (node.id === focusEntityId) {
      return {
        ...node,
        x: centerX,
        y: centerY
      }
    }

    const index = outerNodes.findIndex((item) => item.id === node.id)
    const angle = (index / Math.max(outerNodes.length, 1)) * Math.PI * 2 - Math.PI / 2
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    }
  })

  const nodeMap = new Map(positionedNodes.map((node) => [node.id, node]))
  const focusNode = positionedNodes.find((node) => node.id === focusEntityId)
  const relationDensity = nodes.length > 1 ? (edges.length / (nodes.length - 1)).toFixed(1) : '0.0'

  return (
    <div className={minimal ? 'graph-shell graph-shell-minimal' : 'graph-shell'}>
      {!minimal ? (
        <div className="graph-toolbar">
          <div>
            <h3 className="section-title">Recent note graph</h3>
            <p className="section-subtitle">The newest note stays in the center and nearby relations expand around it.</p>
          </div>
          <div className="graph-badges">
            <span className="badge success">{nodes.length} notes</span>
            <span className="badge">{edges.length} links</span>
            <span className="badge">density {relationDensity}</span>
          </div>
        </div>
      ) : null}

      <div className={minimal ? 'graph-stage graph-stage-home' : 'graph-stage'}>
        <div className="graph-stage-glow" />
        <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`}>
          {edges.map((edge) => {
            const source = nodeMap.get(edge.source)
            const target = nodeMap.get(edge.target)
            if (!source || !target) {
              return null
            }

            const midX = (source.x + target.x) / 2
            const midY = (source.y + target.y) / 2
            const labelWidth = Math.max(edge.label.length * 12, 64)

            return (
              <g key={edge.id}>
                <line className="graph-edge" stroke="var(--graph-edge)" strokeWidth="2" x1={source.x} x2={target.x} y1={source.y} y2={target.y} />
                <rect className="graph-edge-label-bg" height="26" rx="10" width={labelWidth} x={midX - labelWidth / 2} y={midY - 13} />
                <text className="graph-edge-label" textAnchor="middle" x={midX} y={midY + 4}>
                  {edge.label}
                </text>
              </g>
            )
          })}

          {positionedNodes.map((node) => {
            const isFocus = node.id === focusEntityId
            const titleColor = isFocus ? 'var(--graph-focus-text)' : 'var(--text)'
            const typeColor = isFocus ? 'color-mix(in srgb, var(--graph-focus-text) 70%, transparent)' : 'var(--text-muted)'

            return (
              <g key={node.id}>
                <circle className={isFocus ? 'graph-node graph-node-focus' : 'graph-node'} cx={node.x} cy={node.y} r={isFocus ? 42 : 30} />
                <text className="graph-node-title" fill={titleColor} textAnchor="middle" x={node.x} y={node.y - 3}>
                  {node.name.slice(0, 10)}
                </text>
                <text className="graph-node-type" fill={typeColor} textAnchor="middle" x={node.x} y={node.y + 15}>
                  {node.type.slice(0, 12)}
                </text>
              </g>
            )
          })}
        </svg>

        <div className={minimal ? 'graph-overlay-card graph-overlay-card-home' : 'graph-overlay-card'}>
          <div className="graph-overlay-label">{minimal ? 'Recent edits' : 'Focus note'}</div>
          <div className="graph-overlay-title">{focusNode?.name ?? 'N/A'}</div>
          <p className="graph-overlay-text">
            {focusNode?.summary ?? 'The centered note anchors the recent relationship view.'}
          </p>
          {minimal ? <div className="graph-overlay-meta">{nodes.length} notes · {edges.length} links · density {relationDensity}</div> : null}
        </div>
      </div>

      {!minimal ? (
        <div className="entity-list graph-node-list">
          {positionedNodes.map((node) => (
            <div className={node.id === focusEntityId ? 'entity-item entity-item-focus' : 'entity-item'} key={node.id}>
              <div className="entity-item-head">
                <div>
                  <h4 className="entity-item-title">{node.name}</h4>
                  <div className="entity-meta">
                    <span className={node.id === focusEntityId ? 'badge success' : 'badge'}>{node.type}</span>
                    {node.id === focusEntityId ? <span>Focus</span> : null}
                  </div>
                </div>
                <Link className="button ghost" href={`/entities/${node.id}`}>
                  Open
                </Link>
              </div>
              <div className="entity-item-summary">{node.summary || 'No summary available.'}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
