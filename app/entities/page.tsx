import type { EntityTemplateField } from '@/app/types'
import { NotesWorkspace } from '@/components/notes/notes-workspace'
import { prisma } from '@/lib/prisma'

export const revalidate = 30

type PageProps = {
  searchParams?: Promise<{
    noteId?: string
  }>
}

export default async function EntitiesPage({ searchParams }: PageProps) {
  const resolved = (await searchParams) ?? {}
  const selectedNoteId = resolved.noteId?.trim()

  const [notes, entityTemplates, relationTemplates] = await Promise.all([
    prisma.entity.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      take: 200,
      select: {
        id: true,
        name: true,
        type: true,
        summary: true,
        updatedAt: true
      }
    }),
    prisma.entityTypeTemplate.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      take: 12
    }),
    prisma.relationTypeTemplate.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      take: 12
    })
  ])

  return (
    <main className="grid notes-page-grid">
      <NotesWorkspace
        notes={notes.map((note) => ({
          id: note.id,
          name: note.name,
          type: note.type,
          summary: note.summary,
          updatedAt: note.updatedAt.toISOString()
        }))}
        entityTemplates={entityTemplates.map((template: { id: string; name: string; schemaJson: unknown }) => ({
          id: template.id,
          name: template.name,
          schemaJson: template.schemaJson as EntityTemplateField[]
        }))}
        relationTemplates={relationTemplates.map((template: { id: string; name: string; schemaJson: unknown }) => ({
          id: template.id,
          name: template.name,
          schemaJson: template.schemaJson as EntityTemplateField[]
        }))}
        selectedNoteId={selectedNoteId}
      />
    </main>
  )
}
