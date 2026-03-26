import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { TerminalPanel } from '../../features/vscode/components/panels/TerminalPanel'
import links from '../../portfolio/data/links.json'
import { useResizablePanel } from '../../features/vscode/hooks/useResizablePanel'

const SIDEBAR_DEFAULT_WIDTH = 240

export const VSCodePortfolio = () => {
  const workbench = useWorkbench()
  const settings = useSettings()
  const [editorMode, setEditorMode] = useState<'preview' | 'code'>('preview')
  const [isProfileOpen, setProfileOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [isTerminalOpen, setTerminalOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 768))
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
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const update = (event?: MediaQueryListEvent) => setIsDesktop(event ? event.matches : mediaQuery.matches)
    update()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }
    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

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

  const canTogglePreview = useMemo(() => activeFile?.kind === 'tsx', [activeFile?.kind])

  const handleToggleEditorMode = useCallback(() => {
    if (!canTogglePreview) return
    setEditorMode((mode) => (mode === 'preview' ? 'code' : 'preview'))
  }, [canTogglePreview])

  const sidebarResize = useResizablePanel({
    axis: 'x',
    storageKey: 'vscode-sidebar-width',
    defaultSize: SIDEBAR_DEFAULT_WIDTH,
    min: 200,
    getMax: ({ width }) => Math.min(520, width * 0.5),
    enabled: workbench.isLeftPanelOpen && isDesktop,
  })

  const sidebarHandleProps = sidebarResize.getHandleProps()

  return (
    <div className={`flex h-full min-h-0 flex-col bg-surface pb-6 theme-${settings.theme} layout-${settings.layout}`}>
      <MacTitleBar
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setTerminalOpen((current) => !current)}
        editorMode={editorMode}
        onToggleEditorMode={handleToggleEditorMode}
        canTogglePreview={canTogglePreview}
      />
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
            <div
              className="group/sidebar relative flex h-full"
              style={{ width: `${sidebarResize.size}px` }}
            >
              <LeftPanel
                view={workbench.activeView}
                files={portfolioFiles}
                openFiles={openFiles}
                activeId={activeTabId}
                onSelectFile={openFile}
              />
              <div
                className={`absolute right-0 top-0 hidden h-full w-[6px] cursor-col-resize rounded-sm transition-opacity md:block ${
                  sidebarResize.isResizing ? 'opacity-100 bg-primary/40' : 'opacity-0 group-hover/sidebar:opacity-100 hover:bg-primary/30'
                }`}
                {...sidebarHandleProps}
                onDoubleClick={(event) => {
                  event.preventDefault()
                  sidebarResize.setSize(SIDEBAR_DEFAULT_WIDTH)
                }}
              />
            </div>
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
            {canTogglePreview && (
              <button
                onClick={handleToggleEditorMode}
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
          <div className="flex flex-1 min-h-0 flex-col">
            <EditorView file={activeFile} mode={editorMode} />
            <TerminalPanel
              open={isTerminalOpen}
              onClose={() => setTerminalOpen(false)}
              files={portfolioFiles}
              onOpenFile={openFile}
              theme={settings.theme}
              layout={settings.layout}
              setTheme={settings.setTheme}
              setLayout={settings.setLayout}
              links={links as Record<string, string | undefined>}
            />
          </div>
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
