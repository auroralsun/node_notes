import { TemplateForm } from '@/components/templates/template-form'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

export default async function TemplatesPage() {
  const [entityTemplates, relationTemplates] = await Promise.all([
    prisma.entityTypeTemplate.findMany({ orderBy: [{ updatedAt: 'desc' }], take: 20 }),
    prisma.relationTypeTemplate.findMany({ orderBy: [{ updatedAt: 'desc' }], take: 20 })
  ])

  return (
    <main className="grid">
      <section className="page-header">
        <div>
          <span className="page-kicker">模板库</span>
          <h2 className="page-title">模板</h2>
          <p className="page-subtitle">模板可以让笔记创建和关系录入保持一致，同时无需在主流程暴露复杂 schema。</p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-label">笔记模板</div>
          <div className="stat-value">{entityTemplates.length}</div>
          <div className="stat-note">笔记可复用结构</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">关系模板</div>
          <div className="stat-value">{relationTemplates.length}</div>
          <div className="stat-note">连接可复用结构</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">当前角色</div>
          <div className="stat-value">库</div>
          <div className="stat-note">辅助流程，非主流程</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">产品核心</div>
          <div className="stat-value">笔记</div>
          <div className="stat-note">模板服务写作流程</div>
        </article>
      </section>

      <section className="grid grid-2 content-layout">
        <article className="card">
          <h2 className="section-title">新建笔记模板</h2>
          <p className="section-subtitle">定义稳定字段，在创建笔记时可重复使用。</p>
          <TemplateForm mode="entity" />
        </article>
        <article className="card">
          <h2 className="section-title">笔记模板</h2>
          {entityTemplates.length ? (
            <div className="entity-list note-list">
              {entityTemplates.map((template) => (
                <div className="note-row" key={template.id}>
                  <div className="note-row-main">
                    <div className="note-row-top">
                      <h4 className="note-row-title">{template.name}</h4>
                      <span className="note-row-time">{new Date(template.updatedAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <p className="note-row-summary">{template.description || '暂无描述。'}</p>
                    <pre className="code-block">{JSON.stringify(template.schemaJson, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">暂无笔记模板。</div>
          )}
        </article>
      </section>

      <section className="grid grid-2 content-layout">
        <article className="card">
          <h2 className="section-title">新建关系模板</h2>
          <p className="section-subtitle">为重复出现的关系字段建模，让连接表达更一致。</p>
          <TemplateForm mode="relation" />
        </article>
        <article className="card">
          <h2 className="section-title">关系模板</h2>
          {relationTemplates.length ? (
            <div className="entity-list note-list">
              {relationTemplates.map((template) => (
                <div className="note-row" key={template.id}>
                  <div className="note-row-main">
                    <div className="note-row-top">
                      <h4 className="note-row-title">{template.name}</h4>
                      <span className="note-row-time">{new Date(template.updatedAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <p className="note-row-summary">{template.description || '暂无描述。'}</p>
                    <pre className="code-block">{JSON.stringify(template.schemaJson, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">暂无关系模板。</div>
          )}
        </article>
      </section>
    </main>
  )
}
