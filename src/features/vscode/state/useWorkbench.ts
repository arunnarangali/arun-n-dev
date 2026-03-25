import { useEffect, useState } from 'react'

export type WorkbenchView = 'explorer' | 'search' | 'sourceControl' | 'extensions' | 'settings' | 'account'

const VIEW_STORAGE_KEY = 'vscode-active-view'

const allowedViews: WorkbenchView[] = ['explorer', 'search', 'sourceControl', 'extensions', 'settings', 'account']

export const useWorkbench = () => {
  const [activeView, setActiveView] = useState<WorkbenchView>(() => {
    if (typeof window === 'undefined') return 'explorer'
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (stored && allowedViews.includes(stored as WorkbenchView)) {
      return stored as WorkbenchView
    }
    return 'explorer'
  })
  const [isLeftPanelOpen, setLeftPanelOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 768
  })

  useEffect(() => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, activeView)
  }, [activeView])

  const toggleExplorer = () => {
    setActiveView('explorer')
    setLeftPanelOpen((prev) => !prev)
  }

  const openView = (view: WorkbenchView) => {
    setActiveView(view)
    setLeftPanelOpen(true)
  }

  const closePanel = () => setLeftPanelOpen(false)

  return {
    activeView,
    isLeftPanelOpen,
    openView,
    toggleExplorer,
    closePanel,
  }
}
