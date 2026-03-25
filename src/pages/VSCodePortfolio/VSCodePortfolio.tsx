import { useEffect } from 'react'
import { portfolioFiles } from '../../features/vscode/data/files'
import { useWorkspace } from '../../features/vscode/state/useWorkspace'
import { ActivityBar } from '../../features/vscode/components/ActivityBar'
import { Breadcrumbs } from '../../features/vscode/components/Breadcrumbs'
import { CommandPalette } from '../../features/vscode/components/CommandPalette'
import { EditorTabs } from '../../features/vscode/components/EditorTabs'
import { EditorView } from '../../features/vscode/components/EditorView'
import { Explorer } from '../../features/vscode/components/Explorer'
import { MacTitleBar } from '../../features/vscode/components/MacTitleBar'
import { StatusBar } from '../../features/vscode/components/StatusBar'

export const VSCodePortfolio = () => {
  const {
    openFiles,
    activeFile,
    activeTabId,
    openFile,
    closeFile,
    setActiveTabId,
    isCommandPaletteOpen,
    toggleCommandPalette,
    closeCommandPalette,
  } = useWorkspace()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 'p') {
        event.preventDefault()
        toggleCommandPalette()
      }
      if (key === 'escape') {
        closeCommandPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleCommandPalette, closeCommandPalette])

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface pb-6">
      <MacTitleBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ActivityBar />
        <div className="hidden md:flex">
          <Explorer files={portfolioFiles} openFiles={openFiles} activeId={activeTabId} onSelect={openFile} />
        </div>
        <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <EditorTabs
            tabs={openFiles}
            activeId={activeTabId}
            onSelect={setActiveTabId}
            onClose={closeFile}
          />
          <Breadcrumbs path={activeFile?.path} />
          <EditorView file={activeFile} />
        </main>
      </div>
      <StatusBar />
      <CommandPalette open={isCommandPaletteOpen} onClose={closeCommandPalette} />
    </div>
  )
}
