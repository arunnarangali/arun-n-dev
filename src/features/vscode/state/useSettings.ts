import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light' | 'highContrast'
export type Layout = 'comfortable' | 'compact'

const THEME_STORAGE_KEY = 'vscode-theme'
const LAYOUT_STORAGE_KEY = 'vscode-layout'

export const useSettings = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && ['dark', 'light', 'highContrast'].includes(stored)) {
      return stored as Theme
    }
    return 'dark'
  })

  const [layout, setLayout] = useState<Layout>(() => {
    if (typeof window === 'undefined') return 'comfortable'
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (stored && ['comfortable', 'compact'].includes(stored)) {
      return stored as Layout
    }
    return 'comfortable'
  })

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout)
  }, [layout])

  return {
    theme,
    setTheme,
    layout,
    setLayout,
  }
}
