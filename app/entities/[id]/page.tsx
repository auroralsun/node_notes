import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { EntityTemplateField } from '@/app/types'
import { EntityForm } from '@/components/entities/entity-form'
import { JsonPropsEditor } from '@/components/entities/json-props-editor'
import { LocalGraph } from '@/components/graph/local-graph'
import { RelationForm } from '@/components/relations/relation-form'
import { prisma } from '@/lib/prisma'

export const revalidate = 30

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EntityDetailPage({ params }: PageProps) {
  const { id } = await params

  const [note, entities, relationTemplates] = await Promise.all([
    prisma.entity.findUnique({
      where: { id },
      include: {
        outgoingRelations: {
          include: {
            toEntity: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 12
        },
        incomingRelations: {
          include: {
            fromEntity: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 12
        }
      }
    }),
    prisma.entity.findMany({
      select: {
        id: true,
        name: true,
        type: true
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 40
    }),
    prisma.relationTypeTemplate.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      take: 12
    })
  ])

  if (!note) {
    notFound()
  }

  return (
    <main className="grid">
      <section className="page-header">
        <div>
          <span className="page-kicker">Note Detail</span>
          <h2 className="page-title">{note.name}</h2>
          <p className="page-subtitle">这里应该首先像一篇笔记，其次才是结构化对象。连接、属性和图谱都围绕这条笔记服务，而不是反过来。</p>
        </div>
        <div className="actions">
          <span className="badge">{note.type}</span>
          <Link className="button secondary" href="/entities">
            返回笔记
          </Link>
        </div>
      </section>

      <section className="grid grid-2 content-layout">
        <article className="card">
          <h2 className="section-title">笔记内容</h2>
          <p className="section-subtitle">标题、类型和摘要作为主内容入口；后续如果补正文区，这里会自然进化成真正的笔记编辑面板。</p>
          <EntityForm
            initialValue={{
              id: note.id,
              name: note.name,
              type: note.type,
              summary: note.summary
            }}
            mode="edit"
          />
        </article>

        <article className="card">
          <h2 className="section-title">相关笔记图</h2>
          <p className="section-subtitle">图谱继续保留，但只作为这条笔记的关联视图，而不是让用户一上来先理解“关系系统”。</p>
          <LocalGraph entityId={note.id} />
        </article>
      </section>

      <section className="grid grid-2 content-layout">
        <article className="card">
          <h2 className="section-title">连接这条笔记</h2>
          <p className="section-subtitle">连接被降成笔记详情里的能力入口，减少一级导航暴露的学习成本。</p>
          <RelationForm
            entities={entities}
            focusEntityId={note.id}
            templates={relationTemplates.map((template: { id: string; name: string; schemaJson: unknown }) => ({
              id: template.id,
              name: template.name,
              schemaJson: template.schemaJson as EntityTemplateField[]
            }))}
          />
        </article>

        <article className="card">
          <h2 className="section-title">结构化属性</h2>
          <p className="section-subtitle">属性是笔记的结构层，不必总在一级列表里高频出现。</p>
          <JsonPropsEditor entityId={note.id} initialValue={note.propsJson as Record<string, string | number | boolean | null>} />
        </article>
      </section>

      <section className="grid grid-2 content-layout">
        <article className="card">
          <h2 className="section-title">这条笔记指向的内容</h2>
          {note.outgoingRelations.length ? (
            <div className="entity-list note-list">
              {note.outgoingRelations.map((relation) => (
                <Link className="note-row" href={`/entities/${relation.toEntity.id}`} key={relation.id}>
                  <div className="note-row-main">
                    <div className="note-row-top">
                      <h4 className="note-row-title">{relation.toEntity.name}</h4>
                      <span className="badge success">{relation.relationType}</span>
                    </div>
                    <p className="note-row-summary">{relation.toEntity.summary || '暂无摘要'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">当前还没有出向连接。</div>
          )}
        </article>

        <article className="card">
          <h2 className="section-title">哪些内容连接到它</h2>
          {note.incomingRelations.length ? (
            <div className="entity-list note-list">
              {note.incomingRelations.map((relation) => (
                <Link className="note-row" href={`/entities/${relation.fromEntity.id}`} key={relation.id}>
                  <div className="note-row-main">
                    <div className="note-row-top">
                      <h4 className="note-row-title">{relation.fromEntity.name}</h4>
                      <span className="badge">{relation.relationType}</span>
                    </div>
                    <p className="note-row-summary">{relation.fromEntity.summary || '暂无摘要'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">当前还没有入向连接。</div>
          )}
        </article>
      </section>
    </main>
  )
}
