import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { TopTabs } from '@/components/top-tabs'

export const metadata: Metadata = {
  title: 'Knowledge Graph Notes',
  description: 'A warm, note-first workspace for structured knowledge'
}

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('kgn-theme');
    var theme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;

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
                    <h1 className="brand-title">Notes</h1>
                    <p className="brand-subtitle">Entity as note, property as page, relation as link.</p>
                  </div>
                </div>
              </div>

              <ThemeToggle />
            </div>
            <TopTabs />
          </header>
          <div className="layout">{children}</div>
        </div>
      </body>
    </html>
  )
}
