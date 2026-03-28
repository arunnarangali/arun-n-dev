import { createContext } from 'react'

export type Theme = 'dark' | 'light' | 'highContrast'
export type Layout = 'comfortable' | 'compact'

export type SettingsContextValue = {
  theme: Theme
  setTheme: (value: Theme) => void
  layout: Layout
  setLayout: (value: Layout) => void
  singlePage: boolean
  setSinglePage: (value: boolean) => void
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)
