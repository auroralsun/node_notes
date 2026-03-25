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
          <span className="page-kicker">Template Library</span>
          <h2 className="page-title">Templates</h2>
          <p className="page-subtitle">
            Templates keep note creation and relation capture consistent without exposing raw schema
            complexity in the main workflow.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-label">Note templates</div>
          <div className="stat-value">{entityTemplates.length}</div>
          <div className="stat-note">Reusable structures for notes</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Relation templates</div>
          <div className="stat-value">{relationTemplates.length}</div>
          <div className="stat-note">Reusable structures for links</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Current role</div>
          <div className="stat-value">Library</div>
          <div className="stat-note">Supportive, not primary workflow</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Product focus</div>
          <div className="stat-value">Notes</div>
          <div className="stat-note">Templates serve the writing flow</div>
        </article>
      </section>

      <section className="grid grid-2 content-layout">
        <article className="card">
          <h2 className="section-title">Create note template</h2>
          <p className="section-subtitle">Define stable note fields that can be reused during note creation.</p>
          <TemplateForm mode="entity" />
        </article>
        <article className="card">
          <h2 className="section-title">Note templates</h2>
          {entityTemplates.length ? (
            <div className="entity-list note-list">
              {entityTemplates.map((template) => (
                <div className="note-row" key={template.id}>
                  <div className="note-row-main">
                    <div className="note-row-top">
                      <h4 className="note-row-title">{template.name}</h4>
                      <span className="note-row-time">{new Date(template.updatedAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <p className="note-row-summary">{template.description || 'No description yet.'}</p>
                    <pre className="code-block">{JSON.stringify(template.schemaJson, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No note templates yet.</div>
          )}
        </article>
      </section>

      <section className="grid grid-2 content-layout">
        <article className="card">
          <h2 className="section-title">Create relation template</h2>
          <p className="section-subtitle">Model repeated relation fields so links stay expressive and consistent.</p>
          <TemplateForm mode="relation" />
        </article>
        <article className="card">
          <h2 className="section-title">Relation templates</h2>
          {relationTemplates.length ? (
            <div className="entity-list note-list">
              {relationTemplates.map((template) => (
                <div className="note-row" key={template.id}>
                  <div className="note-row-main">
                    <div className="note-row-top">
                      <h4 className="note-row-title">{template.name}</h4>
                      <span className="note-row-time">{new Date(template.updatedAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <p className="note-row-summary">{template.description || 'No description yet.'}</p>
                    <pre className="code-block">{JSON.stringify(template.schemaJson, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No relation templates yet.</div>
          )}
        </article>
      </section>
    </main>
  )
}
