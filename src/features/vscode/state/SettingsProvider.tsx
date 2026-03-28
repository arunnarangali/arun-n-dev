import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { SettingsContext, type Layout, type SettingsContextValue, type Theme } from './settingsContext'

const THEME_STORAGE_KEY = 'vscode-theme'
const LAYOUT_STORAGE_KEY = 'vscode-layout'
const SINGLE_PAGE_STORAGE_KEY = 'vscode-single-page'

const isTheme = (value: string | null): value is Theme =>
  value === 'dark' || value === 'light' || value === 'highContrast'

const isLayout = (value: string | null): value is Layout => value === 'comfortable' || value === 'compact'

const readStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isTheme(stored) ? stored : 'dark'
}

const readStoredLayout = (): Layout => {
  if (typeof window === 'undefined') return 'comfortable'
  const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
  return isLayout(stored) ? stored : 'comfortable'
}

const readStoredSinglePage = (): boolean => {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(SINGLE_PAGE_STORAGE_KEY)
  if (stored === 'true') return true
  if (stored === 'false') return false
  return true
}

const applyRootClass = (prefix: string, value: string) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  Array.from(root.classList)
    .filter((c) => c.startsWith(`${prefix}-`))
    .forEach((c) => root.classList.remove(c))
  root.classList.add(`${prefix}-${value}`)
}

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)
  const [layout, setLayout] = useState<Layout>(readStoredLayout)
  const [singlePage, setSinglePage] = useState<boolean>(readStoredSinglePage)

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyRootClass('theme', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout)
    applyRootClass('layout', layout)
  }, [layout])

  useEffect(() => {
    window.localStorage.setItem(SINGLE_PAGE_STORAGE_KEY, String(singlePage))
  }, [singlePage])

  const value: SettingsContextValue = useMemo(
    () => ({ theme, setTheme, layout, setLayout, singlePage, setSinglePage }),
    [theme, layout, singlePage],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
