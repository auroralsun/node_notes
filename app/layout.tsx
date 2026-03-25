import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { TopTabs } from '@/components/top-tabs'

export const metadata: Metadata = {
  title: '知识图谱笔记',
  description: '以笔记为中心的结构化知识工作台'
}

const themeInitScript = `
(function () {
  try {
    document.documentElement.dataset.theme = 'light';

    if (window.desktopApp && window.desktopApp.isDesktop) {
      document.documentElement.dataset.runtime = 'desktop';
    }
  } catch (error) {}
})();
`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <div className="top-shell">
          <header className="topbar">
            <div className="topbar-main topbar-main-compact">
              <div className="brand brand-compact">
                <div className="brand-row">
                  <div className="brand-badge">N</div>
                  <div>
                    <h1 className="brand-title">知识笔记</h1>
                    <p className="brand-subtitle">实体即笔记、属性即页面、关系即连接。</p>
                  </div>
                </div>
              </div>

            </div>
            <TopTabs />
          </header>
          <div className="layout">{children}</div>
        </div>
      </body>
    </html>
  )
}
