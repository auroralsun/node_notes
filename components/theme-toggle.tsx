'use client'

import { useEffect, useState } from 'react'

type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'kgn-theme'

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const nextTheme = saved === 'dark' ? 'dark' : 'light'
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }, [])

  function handleChange(nextTheme: ThemeMode) {
    setTheme(nextTheme)
    applyTheme(nextTheme)
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
  }

  return (
    <div className="theme-toggle" role="tablist" aria-label="Theme switcher">
      <button
        className={theme === 'light' ? 'theme-chip active' : 'theme-chip'}
        onClick={() => handleChange('light')}
        type="button"
      >
        Warm
      </button>
      <button
        className={theme === 'dark' ? 'theme-chip active' : 'theme-chip'}
        onClick={() => handleChange('dark')}
        type="button"
      >
        Dark
      </button>
    </div>
  )
}
