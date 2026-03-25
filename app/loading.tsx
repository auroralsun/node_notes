export default function 加载中() {
  return (
    <main className="grid">
      <section className="page-header">
        <div>
          <span className="page-kicker">加载中</span>
          <h2 className="page-title">正在切换页面…</h2>
          <p className="page-subtitle">页面数据加载中，这里先给一个稳定占位，避免切换时体感发空。</p>
        </div>
      </section>

      <section className="stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <article className="stat-card skeleton-block" key={index} />
        ))}
      </section>

      <section className="grid grid-2 content-layout">
        <article className="card skeleton-block skeleton-panel" />
        <article className="card skeleton-block skeleton-panel" />
      </section>
    </main>
  )
}
