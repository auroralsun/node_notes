import type { EntityTemplateField } from '@/app/types'
import { RelationFilterForm } from '@/components/relations/relation-filter-form'
import { RelationForm } from '@/components/relations/relation-form'
import { RelationPropsEditor } from '@/components/relations/relation-props-editor'
import { RelationDeleteButton } from '@/components/relations/relation-delete-button'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<{
    relationType?: string
    entityName?: string
  }>
}

export default async function RelationsPage({ searchParams }: PageProps) {
  const resolved = (await searchParams) ?? {}
  const relationType = resolved.relationType?.trim()
  const entityName = resolved.entityName?.trim()

  const [entities, relations, templates] = await Promise.all([
    prisma.entity.findMany({
      select: { id: true, name: true, type: true },
      orderBy: [{ updatedAt: 'desc' }]
    }),
    prisma.relation.findMany({
      where: {
        ...(relationType ? { relationType } : {}),
        ...(entityName
          ? {
              OR: [
                { fromEntity: { name: { contains: entityName } } },
                { toEntity: { name: { contains: entityName } } }
              ]
            }
          : {})
      },
      include: {
        fromEntity: true,
        toEntity: true
      },
      orderBy: [{ updatedAt: 'desc' }]
    }),
    prisma.relationTypeTemplate.findMany({
      orderBy: [{ updatedAt: 'desc' }]
    })
  ])

  return (
    <main className="grid">
      <section className="page-header">
        <div>
          <span className="page-kicker">Relations Workspace</span>
          <h2 className="page-title">Relations</h2>
          <p className="page-subtitle">
            This is where semantic links live: filter them, create them from templates, and refine
            their structured properties.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-label">Filtered relations</div>
          <div className="stat-value">{relations.length}</div>
          <div className="stat-note">Within the current view</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Available entities</div>
          <div className="stat-value">{entities.length}</div>
          <div className="stat-note">Ready to be linked</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Relation templates</div>
          <div className="stat-value">{templates.length}</div>
          <div className="stat-note">Reusable schema defaults</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">View mode</div>
          <div className="stat-value">Graph</div>
          <div className="stat-note">Structured network thinking</div>
        </article>
      </section>

      <RelationFilterForm />

      <section className="grid grid-2">
        <article className="card">
          <h2 className="section-title">Create relation</h2>
          <p className="section-subtitle">Use templates and explicit types to keep relation semantics consistent.</p>
          <RelationForm
            templates={templates.map((template: { id: string; name: string; schemaJson: unknown }) => ({
              id: template.id,
              name: template.name,
              schemaJson: template.schemaJson as EntityTemplateField[]
            }))}
            entities={entities}
          />
        </article>

        <article className="card">
          <h2 className="section-title">Relation list</h2>
          <p className="section-subtitle">Recently updated relations stay near the top so cleanup work is faster.</p>
          {relations.length ? (
            <div className="entity-list">
              {relations.map((relation) => (
                <div className="entity-item" key={relation.id}>
                  <div className="entity-item-head">
                    <div>
                      <h4 className="entity-item-title">{relation.fromEntity.name} → {relation.toEntity.name}</h4>
                      <div className="entity-meta">
                        <span className="badge success">{relation.relationType}</span>
                      </div>
                    </div>
                    <RelationDeleteButton relationId={relation.id} />
                  </div>
                  <RelationPropsEditor
                    initialValue={relation.propsJson as Record<string, string | number | boolean | null>}
                    relationId={relation.id}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No relations match the current filter.</div>
          )}
        </article>
      </section>
    </main>
  )
}
