import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'dark' | 'light' | 'highContrast'
export type Layout = 'comfortable' | 'compact'

const THEME_STORAGE_KEY = 'vscode-theme'
const LAYOUT_STORAGE_KEY = 'vscode-layout'

type SettingsContextValue = {
  theme: Theme
  setTheme: (value: Theme) => void
  layout: Layout
  setLayout: (value: Layout) => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

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

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyRootClass('theme', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout)
    applyRootClass('layout', layout)
  }, [layout])

  useEffect(() => {
    applyRootClass('theme', theme)
    applyRootClass('layout', layout)
  }, [])

  const value = useMemo(() => ({ theme, setTheme, layout, setLayout }), [theme, layout])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}
