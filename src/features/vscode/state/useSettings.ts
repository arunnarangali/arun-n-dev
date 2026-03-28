import { useContext } from 'react'
import { SettingsContext, type Layout, type SettingsContextValue, type Theme } from './settingsContext'

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}

export type { Layout, SettingsContextValue, Theme }
