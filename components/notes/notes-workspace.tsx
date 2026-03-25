'use client'

import { useEffect, useMemo, useState } from 'react'
import type { EntityTemplateField, JsonScalar } from '@/app/types'
import { MarkdownPreview } from '@/components/notes/markdown-preview'

type RelationItem = {
  id: string
  relationType: string
  fromEntityId: string
  toEntityId: string
  fromEntityName: string
  toEntityName: string
}

type NoteListItem = {
  id: string
  name: string
  type: string
  summary: string | null
  updatedAt: string
}

type NoteDetail = NoteListItem & {
  propsJson: Record<string, JsonScalar>
  outgoingRelations: RelationItem[]
  incomingRelations: RelationItem[]
}

type RelationTemplate = {
  id: string
  name: string
  schemaJson: EntityTemplateField[]
}

type EntityTemplate = {
  id: string
  name: string
  schemaJson: EntityTemplateField[]
}

type NotesWorkspaceProps = {
  notes: NoteListItem[]
  relationTemplates: RelationTemplate[]
  entityTemplates: EntityTemplate[]
  selectedNoteId?: string
}

type PropertyType = 'string' | 'number' | 'boolean'
type SortMode = 'updated-desc' | 'name-asc'
type NoteContextMenu = { noteId: string; x: number; y: number } | null

function stringifyValue(value: JsonScalar) {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value === null) return ''
  return String(value)
}

function inferPropType(value: JsonScalar): PropertyType {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'string'
}

function buildTemplateDefaults(schema: EntityTemplateField[]) {
  return schema.reduce<Record<string, JsonScalar>>((acc, field) => {
    acc[field.key] = field.type === 'boolean' ? false : field.type === 'number' ? 0 : ''
    return acc
  }, {})
}

function mapDetail(payload: Record<string, unknown>): NoteDetail {
  const name = String(payload.name ?? '')

  return {
    id: String(payload.id),
    name,
    type: String(payload.type ?? ''),
    summary: (payload.summary as string | null | undefined) ?? null,
    updatedAt: String(payload.updatedAt),
    propsJson: (payload.propsJson as Record<string, JsonScalar>) ?? {},
    outgoingRelations: ((payload.outgoingRelations as Array<Record<string, unknown>>) ?? []).map((relation) => ({
      id: String(relation.id),
      relationType: String(relation.relationType),
      fromEntityId: String(relation.fromEntityId),
      toEntityId: String(relation.toEntityId),
      fromEntityName: name,
      toEntityName: String((relation.toEntity as Record<string, unknown>)?.name ?? '')
    })),
    incomingRelations: ((payload.incomingRelations as Array<Record<string, unknown>>) ?? []).map((relation) => ({
      id: String(relation.id),
      relationType: String(relation.relationType),
      fromEntityId: String(relation.fromEntityId),
      toEntityId: String(relation.toEntityId),
      fromEntityName: String((relation.fromEntity as Record<string, unknown>)?.name ?? ''),
      toEntityName: name
    }))
  }
}

export function NotesWorkspace({ notes, relationTemplates, entityTemplates, selectedNoteId }: NotesWorkspaceProps) {
  const [noteItems, setNoteItems] = useState(notes)
  const [activeNoteId, setActiveNoteId] = useState(selectedNoteId ?? '')
  const [activeNote, setActiveNote] = useState<NoteDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [activePropKey, setActivePropKey] = useState('summary')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('updated-desc')
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null)
  const [relationModalOpen, setRelationModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [toEntityId, setToEntityId] = useState('')
  const [relationType, setRelationType] = useState('related_to')
  const [templateId, setTemplateId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [propDraft, setPropDraft] = useState('')
  const [propType, setPropType] = useState<PropertyType>('string')
  const [markdownMode, setMarkdownMode] = useState<'edit' | 'preview'>('preview')
  const [newPropName, setNewPropName] = useState('')
  const [newPropType, setNewPropType] = useState<PropertyType>('string')
  const [propSaving, setPropSaving] = useState(false)
  const [propError, setPropError] = useState('')
  const [relationBusyId, setRelationBusyId] = useState('')
  const [deleteBusyId, setDeleteBusyId] = useState('')
  const [createName, setCreateName] = useState('')
  const [createType, setCreateType] = useState('')
  const [createSummary, setCreateSummary] = useState('')
  const [createTemplateId, setCreateTemplateId] = useState('')
  const [createError, setCreateError] = useState('')
  const [createSaving, setCreateSaving] = useState(false)
  const [contextMenu, setContextMenu] = useState<NoteContextMenu>(null)

  useEffect(() => {
    setNoteItems(notes)
  }, [notes])

  const visibleNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = noteItems.filter((note) => {
      if (!query) return true
      return [note.name, note.type, note.summary ?? ''].some((value) => value.toLowerCase().includes(query))
    })

    return [...filtered].sort((a, b) => {
      if (sortMode === 'name-asc') {
        return a.name.localeCompare(b.name, 'zh-CN')
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [noteItems, searchQuery, sortMode])

  const propEntries = useMemo(() => {
    if (!activeNote) return [] as Array<[string, JsonScalar]>
    return [['summary', activeNote.summary ?? ''] as [string, JsonScalar], ...Object.entries(activeNote.propsJson || {})]
  }, [activeNote])
  const activeProp = propEntries.find(([key]) => key === activePropKey) ?? propEntries[0]
  const selectedTemplate = relationTemplates.find((item) => item.id === templateId)
  const selectedCreateTemplate = entityTemplates.find((item) => item.id === createTemplateId)
  const noteRelationCount = activeNote ? activeNote.outgoingRelations.length + activeNote.incomingRelations.length : 0
  const isMarkdownProperty = propType === 'string'

  useEffect(() => {
    if (!activeProp) return
    setPropDraft(stringifyValue(activeProp[1]))
    setPropType(inferPropType(activeProp[1]))
    setMarkdownMode('preview')
    setPropError('')
  }, [activeProp?.[0], activeProp?.[1]])

  async function loadNoteDetail(noteId: string) {
    setDetailLoading(true)
    setDetailError('')

    try {
      const response = await fetch(`/api/entities/${noteId}`, {
        method: 'GET',
        cache: 'no-store'
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        setDetailError(payload?.error ?? 'Failed to load note detail.')
        setActiveNote(null)
        return
      }

      const payload = (await response.json()) as Record<string, unknown>
      const nextNote = mapDetail(payload)
      setActiveNote(nextNote)
      setActivePropKey((current) => {
        const hasCurrent = current === 'summary' || Object.prototype.hasOwnProperty.call(nextNote.propsJson, current)
        return hasCurrent ? current : 'summary'
      })
    } catch {
      setDetailError('Failed to load note detail.')
      setActiveNote(null)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (!activeNoteId) {
      setActiveNote(null)
      setDetailLoading(false)
      return
    }

    void loadNoteDetail(activeNoteId)
  }, [activeNoteId])

  useEffect(() => {
    if (!contextMenu) return

    function closeContextMenu() {
      setContextMenu(null)
    }

    window.addEventListener('click', closeContextMenu)
    return () => {
      window.removeEventListener('click', closeContextMenu)
    }
  }, [contextMenu])

  function syncListItem(note: Pick<NoteDetail, 'id' | 'name' | 'type' | 'summary' | 'updatedAt'>) {
    setNoteItems((current) =>
      current.map((item) =>
        item.id === note.id
          ? {
              ...item,
              name: note.name,
              type: note.type,
              summary: note.summary,
              updatedAt: note.updatedAt
            }
          : item
      )
    )
  }

  function openRelationModal(noteId: string) {
    setContextMenu(null)
    setMenuNoteId(noteId)
    setRelationModalOpen(true)
    setError('')
    setToEntityId('')
    setRelationType('related_to')
    setTemplateId('')
  }

  function openCreateModal() {
    setCreateModalOpen(true)
    setCreateName('')
    setCreateType('')
    setCreateSummary('')
    setCreateTemplateId('')
    setCreateError('')
  }

  async function createNote() {
    setCreateSaving(true)
    setCreateError('')

    const response = await fetch('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createName,
        type: createType,
        summary: createSummary,
        propsJson: selectedCreateTemplate ? buildTemplateDefaults(selectedCreateTemplate.schemaJson) : {}
      })
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setCreateError(data?.error ?? 'Failed to create note.')
      setCreateSaving(false)
      return
    }

    const entity = (await response.json()) as {
      id: string
      name: string
      type: string
      summary: string | null
      updatedAt: string
      propsJson: Record<string, JsonScalar>
    }

    const nextListItem: NoteListItem = {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      summary: entity.summary,
      updatedAt: entity.updatedAt
    }

    setNoteItems((current) => [nextListItem, ...current])
    setActiveNoteId(entity.id)
    setActiveNote({
      ...nextListItem,
      propsJson: entity.propsJson ?? {},
      outgoingRelations: [],
      incomingRelations: []
    })
    setActivePropKey('summary')
    setCreateSaving(false)
    setCreateModalOpen(false)
  }

  async function createRelation() {
    if (!menuNoteId || !toEntityId) {
      setError('Please choose a target note.')
      return
    }

    setSaving(true)
    setError('')

    const propsJson = selectedTemplate
      ? selectedTemplate.schemaJson.reduce<Record<string, JsonScalar>>((acc, field) => {
          acc[field.key] = field.type === 'boolean' ? false : field.type === 'number' ? 0 : ''
          return acc
        }, {})
      : {}

    const response = await fetch('/api/relations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromEntityId: menuNoteId,
        toEntityId,
        relationType,
        propsJson
      })
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? 'Failed to create relation.')
      setSaving(false)
      return
    }

    setSaving(false)
    setRelationModalOpen(false)
    if (activeNoteId && (activeNoteId === menuNoteId || activeNoteId === toEntityId)) {
      void loadNoteDetail(activeNoteId)
    }
  }

  async function deleteNote(noteId: string) {
    setContextMenu(null)
    setDeleteBusyId(noteId)
    const response = await fetch(`/api/entities/${noteId}`, { method: 'DELETE' })
    setDeleteBusyId('')
    if (!response.ok) {
      setPropError('Failed to delete note.')
      return
    }

    setNoteItems((current) => current.filter((item) => item.id !== noteId))
    if (activeNoteId === noteId) {
      setActiveNoteId('')
      setActiveNote(null)
      setActivePropKey('summary')
    }
  }

  async function saveProperty() {
    if (!activeNote || !activeProp) return
    setPropSaving(true)
    setPropError('')

    let response: Response
    if (activeProp[0] === 'summary') {
      response = await fetch(`/api/entities/${activeNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: propDraft })
      })
    } else {
      const nextProps = { ...activeNote.propsJson } as Record<string, JsonScalar>
      nextProps[activeProp[0]] =
        propType === 'boolean' ? propDraft === 'true' : propType === 'number' ? Number(propDraft || 0) : propDraft
      response = await fetch(`/api/entities/${activeNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propsJson: nextProps })
      })
    }

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setPropError(data?.error ?? 'Failed to save property.')
      setPropSaving(false)
      return
    }

    const payload = (await response.json()) as Record<string, unknown>
    const nextNote: NoteDetail = {
      ...activeNote,
      ...mapDetail({
        ...payload,
        outgoingRelations: activeNote.outgoingRelations,
        incomingRelations: activeNote.incomingRelations
      })
    }

    setActiveNote(nextNote)
    syncListItem(nextNote)
    setPropSaving(false)
  }

  async function addProperty() {
    if (!activeNote) return
    const key = newPropName.trim()
    if (!key || key === 'summary') {
      setPropError('Enter a valid property key.')
      return
    }

    setPropSaving(true)
    setPropError('')
    const nextProps = { ...activeNote.propsJson } as Record<string, JsonScalar>
    nextProps[key] = newPropType === 'boolean' ? false : newPropType === 'number' ? 0 : ''

    const response = await fetch(`/api/entities/${activeNote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propsJson: nextProps })
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setPropError(data?.error ?? 'Failed to add property.')
      setPropSaving(false)
      return
    }

    const payload = (await response.json()) as Record<string, unknown>
    const nextNote: NoteDetail = {
      ...activeNote,
      ...mapDetail({
        ...payload,
        outgoingRelations: activeNote.outgoingRelations,
        incomingRelations: activeNote.incomingRelations
      })
    }

    setActiveNote(nextNote)
    syncListItem(nextNote)
    setNewPropName('')
    setNewPropType('string')
    setActivePropKey(key)
    setPropSaving(false)
  }

  async function deleteProperty() {
    if (!activeNote || !activeProp || activeProp[0] === 'summary') return
    setPropSaving(true)
    setPropError('')

    const nextProps = { ...activeNote.propsJson } as Record<string, JsonScalar>
    delete nextProps[activeProp[0]]

    const response = await fetch(`/api/entities/${activeNote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propsJson: nextProps })
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setPropError(data?.error ?? 'Failed to delete property.')
      setPropSaving(false)
      return
    }

    const payload = (await response.json()) as Record<string, unknown>
    const nextNote: NoteDetail = {
      ...activeNote,
      ...mapDetail({
        ...payload,
        outgoingRelations: activeNote.outgoingRelations,
        incomingRelations: activeNote.incomingRelations
      })
    }

    setActiveNote(nextNote)
    syncListItem(nextNote)
    setActivePropKey('summary')
    setPropSaving(false)
  }

  async function deleteRelation(relationId: string) {
    if (!activeNote) return
    setRelationBusyId(relationId)
    const response = await fetch(`/api/relations/${relationId}`, { method: 'DELETE' })
    setRelationBusyId('')
    if (!response.ok) {
      setPropError('Failed to delete relation.')
      return
    }

    setActiveNote({
      ...activeNote,
      outgoingRelations: activeNote.outgoingRelations.filter((relation) => relation.id !== relationId),
      incomingRelations: activeNote.incomingRelations.filter((relation) => relation.id !== relationId)
    })
  }

  return (
    <div className="notes-workspace notes-app-layout">
      <aside className="notes-sidebar notes-sidebar-plain">
        <div className="notes-sidebar-top">
          <div className="notes-list-head">
            <div>
              <div className="field-group-title">Notes</div>
              <div className="field-group-desc">Entity as note. Property as page. Relation as link.</div>
            </div>
            <button aria-label="Create note" className="icon-button" onClick={openCreateModal} type="button">
              +
            </button>
          </div>

          <div className="notes-list-tools">
            <input
              className="input notes-search"
              placeholder="Search notes"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <select className="select notes-sort" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="updated-desc">Recently updated</option>
              <option value="name-asc">Name A-Z</option>
            </select>
          </div>
        </div>

        <div className="notes-tree">
          {visibleNotes.map((note) => (
            <div className={note.id === activeNoteId ? 'notes-tree-item active' : 'notes-tree-item'} key={note.id}>
              <button
                className="notes-tree-trigger"
                onClick={() => {
                  setActiveNoteId(note.id)
                  setActivePropKey('summary')
                }}
                onContextMenu={(event) => {
                  event.preventDefault()
                  setContextMenu({ noteId: note.id, x: event.clientX, y: event.clientY })
                }}
                type="button"
              >
                <span className="notes-tree-name">{note.name}</span>
              </button>
            </div>
          ))}
          {!visibleNotes.length ? <div className="empty">No notes match the current query.</div> : null}
        </div>
      </aside>

      {contextMenu ? (
        <div className="notes-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button className="notes-context-item" onClick={() => openRelationModal(contextMenu.noteId)} type="button">
            创建关系
          </button>
          <button
            className="notes-context-item danger"
            disabled={deleteBusyId === contextMenu.noteId}
            onClick={() => deleteNote(contextMenu.noteId)}
            type="button"
          >
            {deleteBusyId === contextMenu.noteId ? '删除中...' : '删除笔记'}
          </button>
        </div>
      ) : null}

      <section className="notes-main notes-main-plain">
        {!activeNoteId ? (
          <div className="notes-empty-state">
            <div className="empty">Select a note from the left to open its property pages.</div>
          </div>
        ) : detailLoading ? (
          <div className="notes-empty-state">
            <div className="empty">Loading note...</div>
          </div>
        ) : detailError ? (
          <div className="notes-empty-state">
            <div className="empty">{detailError}</div>
          </div>
        ) : activeNote ? (
          <>
            <div className="notes-detail-header">
              <div>
                <div className="page-kicker">Note</div>
                <h2 className="notes-note-title">{activeNote.name}</h2>
                <p className="notes-note-subtitle">
                  The note title is the entity name. Each property becomes its own page inside the note.
                </p>
              </div>
              <div className="notes-meta-bar">
                <span className="badge success">{activeNote.type || 'Untyped note'}</span>
                <span className="badge">{propEntries.length} pages</span>
                <span className="badge">{noteRelationCount} links</span>
              </div>
            </div>

            <div className="notes-detail-grid">
              <section className="notes-content-panel">
                <div className="property-tabs notes-page-tabs">
                  {propEntries.map(([key]) => (
                    <button
                      className={key === activeProp?.[0] ? 'property-tab active' : 'property-tab'}
                      key={key}
                      onClick={() => setActivePropKey(key)}
                      type="button"
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <article className="notes-editor-panel">
                  <div className="notes-editor-head">
                    <div>
                      <h3 className="section-title">{activeProp?.[0] ?? 'summary'}</h3>
                      <p className="section-subtitle notes-editor-subtitle">
                        {activeProp?.[0] === 'summary' ? 'The summary page acts as the note overview.' : 'Each property is edited like a note page.'}
                      </p>
                    </div>
                    <div className="notes-updated-at">Updated {new Date(activeNote.updatedAt).toLocaleString('zh-CN')}</div>
                  </div>

                  <div className="field">
                    <label className="label">Value type</label>
                    <select
                      className="select"
                      disabled={activeProp?.[0] === 'summary'}
                      value={propType}
                      onChange={(event) => setPropType(event.target.value as PropertyType)}
                    >
                      <option value="string">Markdown / Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </div>

                  {isMarkdownProperty ? (
                    <div className="markdown-mode-bar">
                      <button
                        className={markdownMode === 'preview' ? 'property-tab active' : 'property-tab'}
                        onClick={() => setMarkdownMode('preview')}
                        type="button"
                      >
                        Preview
                      </button>
                      <button
                        className={markdownMode === 'edit' ? 'property-tab active' : 'property-tab'}
                        onClick={() => setMarkdownMode('edit')}
                        type="button"
                      >
                        Edit
                      </button>
                    </div>
                  ) : null}

                  <div className="field">
                    <label className="label">Page content</label>
                    {propType === 'boolean' ? (
                      <select className="select" value={propDraft} onChange={(event) => setPropDraft(event.target.value)}>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : propType === 'number' ? (
                      <input className="input" value={propDraft} onChange={(event) => setPropDraft(event.target.value)} />
                    ) : markdownMode === 'preview' ? (
                      <div className="markdown-surface notes-markdown-surface">
                        <MarkdownPreview content={propDraft} />
                      </div>
                    ) : (
                      <textarea
                        className="textarea property-textarea markdown-editor notes-editor-textarea"
                        value={propDraft}
                        onChange={(event) => setPropDraft(event.target.value)}
                      />
                    )}
                  </div>

                  {propError ? <div className="notice danger">{propError}</div> : null}

                  <div className="actions">
                    <button className="button" disabled={propSaving} onClick={saveProperty} type="button">
                      {propSaving ? 'Saving...' : 'Save page'}
                    </button>
                  </div>
                </article>
              </section>

              <aside className="notes-side-panel">
                <section className="notes-side-card">
                  <div className="field-group-head">
                    <div>
                      <div className="field-group-title">New property page</div>
                      <div className="field-group-desc">Add another page inside this note.</div>
                    </div>
                  </div>

                  <div className="grid grid-2 property-toolbar-grid">
                    <div className="field">
                      <label className="label">Page name</label>
                      <input
                        className="input"
                        placeholder="e.g. meeting_notes"
                        value={newPropName}
                        onChange={(event) => setNewPropName(event.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label">Value type</label>
                      <select className="select" value={newPropType} onChange={(event) => setNewPropType(event.target.value as PropertyType)}>
                        <option value="string">Markdown / Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                  </div>

                  <div className="actions">
                    <button className="button secondary" disabled={propSaving} onClick={addProperty} type="button">
                      Add page
                    </button>
                    {activeProp?.[0] !== 'summary' ? (
                      <button className="button danger" disabled={propSaving} onClick={deleteProperty} type="button">
                        Delete current page
                      </button>
                    ) : null}
                  </div>
                </section>

                <section className="notes-side-card">
                  <div className="field-group-head">
                    <div>
                      <div className="field-group-title">Relations</div>
                      <div className="field-group-desc">Right-click a note name in the list to create a relation.</div>
                    </div>
                    <span className="badge">{noteRelationCount}</span>
                  </div>

                  <div className="relation-list">
                    {activeNote.outgoingRelations.map((relation) => (
                      <div className="relation-row" key={relation.id}>
                        <div>
                          <div className="relation-row-title">{activeNote.name} -&gt; {relation.toEntityName}</div>
                          <div className="relation-row-meta">{relation.relationType}</div>
                        </div>
                        <button
                          className="button ghost"
                          disabled={relationBusyId === relation.id}
                          onClick={() => deleteRelation(relation.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    {activeNote.incomingRelations.map((relation) => (
                      <div className="relation-row" key={relation.id}>
                        <div>
                          <div className="relation-row-title">{relation.fromEntityName} -&gt; {activeNote.name}</div>
                          <div className="relation-row-meta">{relation.relationType}</div>
                        </div>
                        <button
                          className="button ghost"
                          disabled={relationBusyId === relation.id}
                          onClick={() => deleteRelation(relation.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    {!activeNote.outgoingRelations.length && !activeNote.incomingRelations.length ? (
                      <div className="empty">No relations yet for this note.</div>
                    ) : null}
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : null}
      </section>

      {relationModalOpen ? (
        <div className="modal-backdrop" onClick={() => setRelationModalOpen(false)}>
          <div className="modal-card modal-card-compact" onClick={(event) => event.stopPropagation()}>
            <div className="field-group-head">
              <div>
                <div className="field-group-title">Create relation</div>
                <div className="field-group-desc">Connect one note to another and apply relation properties if needed.</div>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="label">Source note</label>
                <input className="input" readOnly value={noteItems.find((note) => note.id === menuNoteId)?.name ?? ''} />
              </div>
              <div className="field">
                <label className="label">Target note</label>
                <select className="select" value={toEntityId} onChange={(event) => setToEntityId(event.target.value)}>
                  <option value="">Choose a target</option>
                  {noteItems
                    .filter((note) => note.id !== menuNoteId)
                    .map((note) => (
                      <option key={note.id} value={note.id}>
                        {note.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Relation name</label>
                <input className="input" value={relationType} onChange={(event) => setRelationType(event.target.value)} />
              </div>
              <div className="field">
                <label className="label">Relation template</label>
                <select className="select" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                  <option value="">No template</option>
                  {relationTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              {error ? <div className="notice danger">{error}</div> : null}
              <div className="actions">
                <button className="button" disabled={saving} onClick={createRelation} type="button">
                  {saving ? 'Creating...' : 'Create relation'}
                </button>
                <button className="button secondary" onClick={() => setRelationModalOpen(false)} type="button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {createModalOpen ? (
        <div className="modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-card modal-card-compact" onClick={(event) => event.stopPropagation()}>
            <div className="field-group-head">
              <div>
                <div className="field-group-title">Create note</div>
                <div className="field-group-desc">Create a note entity and optionally start from a template.</div>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="label">Note name</label>
                <input className="input" value={createName} onChange={(event) => setCreateName(event.target.value)} />
              </div>
              <div className="field">
                <label className="label">Note type</label>
                <input className="input" value={createType} onChange={(event) => setCreateType(event.target.value)} />
              </div>
              <div className="field">
                <label className="label">Summary</label>
                <textarea className="textarea" value={createSummary} onChange={(event) => setCreateSummary(event.target.value)} />
              </div>
              <div className="field">
                <label className="label">Template</label>
                <select className="select" value={createTemplateId} onChange={(event) => setCreateTemplateId(event.target.value)}>
                  <option value="">No template</option>
                  {entityTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              {createError ? <div className="notice danger">{createError}</div> : null}
              <div className="actions">
                <button className="button" disabled={createSaving} onClick={createNote} type="button">
                  {createSaving ? 'Creating...' : 'Create note'}
                </button>
                <button className="button secondary" onClick={() => setCreateModalOpen(false)} type="button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
