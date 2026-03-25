'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type RelationDeleteButtonProps = {
  relationId: string
}

export function RelationDeleteButton({ relationId }: RelationDeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm('确认删除这条关系？')
    if (!confirmed) {
      return
    }

    setLoading(true)
    setError('')

    const response = await fetch(`/api/relations/${relationId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? '删除关系失败')
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="actions">
      <button className="button danger" disabled={loading} onClick={handleDelete} type="button">
        {loading ? '删除中...' : '删除关系'}
      </button>
      {error ? <span className="notice danger">{error}</span> : null}
    </div>
  )
}
