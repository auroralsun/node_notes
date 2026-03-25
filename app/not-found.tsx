import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="card">
      <h2 className="section-title">页面不存在</h2>
      <p className="page-subtitle">要找的实体或页面不存在，先回实体列表看看。</p>
      <div className="actions" style={{ marginTop: 16 }}>
        <Link className="button secondary" href="/entities">
          返回实体列表
        </Link>
      </div>
    </main>
  )
}
