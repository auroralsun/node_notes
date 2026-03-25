'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'

const tabs: Array<{ href: Route; label: string; hint: string }> = [
  { href: '/', label: '主页', hint: '最近关系图' },
  { href: '/entities', label: '笔记', hint: '全部笔记' }
]

export function TopTabs() {
  const pathname = usePathname()

  return (
    <div className="top-tabs-wrap">
      <nav className="top-tabs">
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link className={active ? 'top-tab active' : 'top-tab'} href={tab.href} key={tab.href}>
              <span className="top-tab-label">{tab.label}</span>
              <span className="top-tab-hint">{tab.hint}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
