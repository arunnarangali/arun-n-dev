import { useEffect, useState } from 'react'
import { portfolioFiles } from '../../features/vscode/data/files'
import { useWorkspace } from '../../features/vscode/state/useWorkspace'
import { useWorkbench } from '../../features/vscode/state/useWorkbench'
import { useSettings } from '../../features/vscode/state/useSettings'
import { ActivityBar } from '../../features/vscode/components/ActivityBar'
import { Breadcrumbs } from '../../features/vscode/components/Breadcrumbs'
import { CommandPalette } from '../../features/vscode/components/CommandPalette'
import { EditorTabs } from '../../features/vscode/components/EditorTabs'
import { EditorView } from '../../features/vscode/components/EditorView'
import { FloatingContact } from '../../features/vscode/components/FloatingContact'
import { LeftPanel } from '../../features/vscode/components/LeftPanel'
import { MacTitleBar } from '../../features/vscode/components/MacTitleBar'
import { ProfileModal } from '../../features/vscode/components/ProfileModal'
import { SettingsModal } from '../../features/vscode/components/SettingsModal'
import { StatusBar } from '../../features/vscode/components/StatusBar'

export const VSCodePortfolio = () => {
  const workbench = useWorkbench()
  const settings = useSettings()
  const [editorMode, setEditorMode] = useState<'preview' | 'code'>('preview')
  const [isProfileOpen, setProfileOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
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

  useEffect(() => {
    setEditorMode('preview')
  }, [activeFile?.id])

  return (
    <div className={`flex h-full min-h-0 flex-col bg-surface pb-6 theme-${settings.theme} layout-${settings.layout}`}>
      <MacTitleBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ActivityBar
          activeView={workbench.activeView}
          onToggleExplorer={workbench.toggleExplorer}
          onSelectView={workbench.openView}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <div className="hidden md:flex">
          {workbench.isLeftPanelOpen && (
            <LeftPanel
              view={workbench.activeView}
              files={portfolioFiles}
              openFiles={openFiles}
              activeId={activeTabId}
              onSelectFile={openFile}
            />
          )}
        </div>
        <main className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
          <EditorTabs
            tabs={openFiles}
            activeId={activeTabId}
            onSelect={(id) => {
              setActiveTabId(id)
              setEditorMode('preview')
            }}
            onClose={closeFile}
          />
          <div className="flex items-center justify-between px-4 py-2">
            <Breadcrumbs path={activeFile?.path} />
            {activeFile?.kind === 'tsx' && (
              <button
                onClick={() => setEditorMode((mode) => (mode === 'preview' ? 'code' : 'preview'))}
                className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/40 bg-surface-container-lowest text-emerald-500 shadow-lg shadow-black/30 transition hover:border-emerald-300"
                aria-label={editorMode === 'preview' ? 'View code' : 'View preview'}
                title={editorMode === 'preview' ? 'View code' : 'View preview'}
              >
                <span className="material-symbols-outlined">
                  {editorMode === 'preview' ? 'code' : 'visibility'}
                </span>
              </button>
            )}
          </div>
          <EditorView file={activeFile} mode={editorMode} />
        </main>
      </div>
      {workbench.isLeftPanelOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={workbench.closePanel} />
          <div className="absolute inset-y-0 right-0 w-full animate-slide-in bg-surface-container-low">
            <LeftPanel
              view={workbench.activeView}
              files={portfolioFiles}
              openFiles={openFiles}
              activeId={activeTabId}
              onSelectFile={openFile}
              variant="overlay"
              onClose={workbench.closePanel}
            />
          </div>
        </div>
      )}
      <StatusBar />
      <CommandPalette open={isCommandPaletteOpen} onClose={closeCommandPalette} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      <FloatingContact />
    </div>
  )
}
