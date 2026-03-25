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
          <span className="page-kicker">关系工作台</span>
          <h2 className="page-title">关系</h2>
          <p className="page-subtitle">
            在这里管理语义连接：筛选关系、按模板创建，并完善结构化属性。
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-label">筛选结果</div>
          <div className="stat-value">{relations.length}</div>
          <div className="stat-note">当前视图内</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">可用实体</div>
          <div className="stat-value">{entities.length}</div>
          <div className="stat-note">可直接建立连接</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">关系模板</div>
          <div className="stat-value">{templates.length}</div>
          <div className="stat-note">可复用的字段默认值</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">视图模式</div>
          <div className="stat-value">图谱</div>
          <div className="stat-note">结构化网络视角</div>
        </article>
      </section>

      <RelationFilterForm />

      <section className="grid grid-2">
        <article className="card">
          <h2 className="section-title">新建关系</h2>
          <p className="section-subtitle">使用模板与明确类型，保持关系语义一致。</p>
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
          <h2 className="section-title">关系列表</h2>
          <p className="section-subtitle">最近更新的关系会置顶，便于快速整理。</p>
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
            <div className="empty">当前筛选条件下暂无关系。</div>
          )}
        </article>
      </section>
    </main>
  )
}
