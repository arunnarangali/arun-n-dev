import { useCallback, useMemo, useState } from 'react'
import type { PortfolioFile } from '../data/files'
import { getFileById, portfolioFiles } from '../data/files'

const defaultFileId = portfolioFiles[0]?.id ?? ''

export const useWorkspace = () => {
  const [openTabs, setOpenTabs] = useState<string[]>(defaultFileId ? [defaultFileId] : [])
  const [activeTabId, setActiveTabId] = useState(defaultFileId)
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const activeFile = useMemo(() => getFileById(activeTabId) ?? getFileById(defaultFileId), [activeTabId])
  const openFiles = useMemo(
    () =>
      openTabs
        .map((id) => getFileById(id))
        .filter((file): file is PortfolioFile => Boolean(file)),
    [openTabs],
  )

  const openFile = useCallback((id: string) => {
    if (!getFileById(id)) return
    setOpenTabs((tabs) => (tabs.includes(id) ? tabs : [...tabs, id]))
    setActiveTabId(id)
  }, [])

  const closeFile = useCallback(
    (id: string) => {
      setOpenTabs((tabs) => {
        const filtered = tabs.filter((tabId) => tabId !== id)
        if (filtered.length === 0) {
          const fallback = defaultFileId && defaultFileId !== id ? defaultFileId : portfolioFiles[0]?.id
          if (fallback) {
            setActiveTabId(fallback)
            return [fallback]
          }
          setActiveTabId('')
          return []
        }
        if (id === activeTabId) {
          const closedIndex = tabs.indexOf(id)
          const nextIndex = Math.min(closedIndex, filtered.length - 1)
          setActiveTabId(filtered[nextIndex])
        }
        return filtered
      })
    },
    [activeTabId],
  )

  const toggleCommandPalette = useCallback((open?: boolean) => {
    setCommandPaletteOpen((current) => (typeof open === 'boolean' ? open : !current))
  }, [])

  return {
    openTabs,
    openFiles,
    activeTabId,
    activeFile,
    openFile,
    closeFile,
    setActiveTabId,
    isCommandPaletteOpen,
    openCommandPalette: () => toggleCommandPalette(true),
    closeCommandPalette: () => toggleCommandPalette(false),
    toggleCommandPalette,
  }
}
