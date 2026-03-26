import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { getFileById, portfolioFiles } from '../../features/vscode/data/files'
import { useWorkspace } from '../../features/vscode/state/useWorkspace'
import { useWorkbench } from '../../features/vscode/state/useWorkbench'
import { useSettings } from '../../features/vscode/state/useSettings'
import { ActivityBar } from '../../features/vscode/components/ActivityBar'
import { CommandPalette } from '../../features/vscode/components/CommandPalette'
import { FloatingContact } from '../../features/vscode/components/FloatingContact'
import { LeftPanel } from '../../features/vscode/components/LeftPanel'
import { MacTitleBar } from '../../features/vscode/components/MacTitleBar'
import { ProfileModal } from '../../features/vscode/components/ProfileModal'
import { SettingsModal } from '../../features/vscode/components/SettingsModal'
import { StatusBar } from '../../features/vscode/components/StatusBar'
import { LoaderScreen } from '../../features/vscode/components/LoaderScreen'
import { TerminalPanel } from '../../features/vscode/components/panels/TerminalPanel'
import links from '../../portfolio/data/links.json'
import { useResizablePanel } from '../../features/vscode/hooks/useResizablePanel'
import { useEditorGroups, type EditorGroupId } from '../../features/vscode/state/useEditorGroups'
import { EditorGroup } from '../../features/vscode/components/EditorGroup'
import { useElementSize } from '../../features/vscode/hooks/useElementSize'

const SIDEBAR_DEFAULT_WIDTH = 240
const MIN_EDITOR_PANE = 320

export const VSCodePortfolio = () => {
  const workbench = useWorkbench()
  const settings = useSettings()
  const [isProfileOpen, setProfileOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [isLoaderOpen, setLoaderOpen] = useState(false)
  const [isTerminalOpen, setTerminalOpen] = useState(true)
  const editorGroups = useEditorGroups()
  const {
    setActiveTabForGroup,
    setActiveGroup,
    removeTabFromGroup,
    collapseGroup,
    ensureTabsValid,
    setExactGroupCount,
    toggleGroupMode,
  } = editorGroups
  const { size: editorAreaSize, setElement: setEditorAreaElement } = useElementSize<HTMLDivElement>()
  const {
    openFiles,
    addToOpenTabs,
    closeFile,
    isCommandPaletteOpen,
    toggleCommandPalette,
    closeCommandPalette,
  } = useWorkspace()
  const [isDesktop, setIsDesktop] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 768))
  const fallbackFileId = useMemo(() => openFiles[0]?.id ?? portfolioFiles[0]?.id ?? '', [openFiles])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const desktopQuery = window.matchMedia('(min-width: 768px)')
    const updateDesktop = (event?: MediaQueryListEvent) => setIsDesktop(event ? event.matches : desktopQuery.matches)
    updateDesktop()
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', updateDesktop)
      return () => desktopQuery.removeEventListener('change', updateDesktop)
    }
    desktopQuery.addListener(updateDesktop)
    return () => desktopQuery.removeListener(updateDesktop)
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
    if (!isDesktop && editorGroups.groupCount > 1) {
      setExactGroupCount(1, editorGroups.activeGroup, fallbackFileId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, fallbackFileId, setExactGroupCount])

  useEffect(() => {
    if (!fallbackFileId) return
    ensureTabsValid(
      openFiles.map((file) => file.id),
      fallbackFileId,
    )
  }, [openFiles, fallbackFileId, ensureTabsValid])

  const handleOpenFile = useCallback(
    (id: string, targetGroup: EditorGroupId = editorGroups.activeGroup) => {
      addToOpenTabs(id)
      setActiveTabForGroup(targetGroup, id)
      setActiveGroup(targetGroup)
    },
    [addToOpenTabs, setActiveTabForGroup, setActiveGroup],
  )

  const handleOpenModalWithLoader = useCallback((openSetter: (open: boolean) => void) => {
    setLoaderOpen(true)
    setTimeout(() => {
      setLoaderOpen(false)
      openSetter(true)
    }, 600)
  }, [])

  const handleSelectTab = useCallback(
    (groupId: EditorGroupId, id: string) => {
      setActiveTabForGroup(groupId, id)
      setActiveGroup(groupId)
    },
    [setActiveTabForGroup, setActiveGroup],
  )

  const focusGroup = useCallback(
    (groupId: EditorGroupId) => {
      setActiveGroup(groupId)
    },
    [setActiveGroup],
  )

  const handleCloseTab = useCallback(
    (groupId: EditorGroupId, id: string) => {
      const currentGroupTabs = editorGroups.tabsByGroup[groupId] ?? []
      const willBeEmpty = currentGroupTabs.length === 1 && currentGroupTabs[0] === id

      const nextTabs = currentGroupTabs.filter((tabId) => tabId !== id)
      const fallbackId = nextTabs[nextTabs.length - 1] ?? fallbackFileId
      removeTabFromGroup(groupId, id, fallbackId)

      const tabStillOpenElsewhere = Object.entries(editorGroups.tabsByGroup).some(([key, tabs]) => {
        const otherGroup = Number(key) as EditorGroupId
        if (otherGroup === groupId) return false
        return tabs.includes(id)
      })
      if (!tabStillOpenElsewhere) {
        closeFile(id)
      }

      if (willBeEmpty && editorGroups.groupCount > 1) {
        collapseGroup(groupId)
      }
    },
    [closeFile, removeTabFromGroup, collapseGroup, fallbackFileId, editorGroups.tabsByGroup, editorGroups.groupCount],
  )

  const currentGroupId = editorGroups.activeGroup
  const currentFileId = editorGroups.activeTabByGroup[currentGroupId]
  const currentFile = useMemo(() => getFileById(currentFileId) ?? openFiles[0], [currentFileId, openFiles])
  const currentMode = editorGroups.modeByGroup[currentGroupId] ?? 'preview'
  const canTogglePreview = currentFile?.kind === 'tsx'

  const handleToggleCurrentMode = () => {
    if (!canTogglePreview) return
    toggleGroupMode(currentGroupId)
  }

  const sidebarResize = useResizablePanel({
    axis: 'x',
    storageKey: 'vscode-sidebar-width',
    defaultSize: SIDEBAR_DEFAULT_WIDTH,
    min: 200,
    getMax: ({ width }) => Math.min(520, width * 0.5),
    enabled: workbench.isLeftPanelOpen && isDesktop,
  })

  const sidebarHandleProps = sidebarResize.getHandleProps()

  const editorWidthFallback = typeof window !== 'undefined' ? window.innerWidth - SIDEBAR_DEFAULT_WIDTH : 1200
  const editorWidth = Math.max(editorAreaSize.width || editorWidthFallback, MIN_EDITOR_PANE * editorGroups.groupCount)

  const splitOne = useResizablePanel({
    axis: 'x',
    storageKey: 'vscode-editor-split-1',
    defaultSize: Math.max(MIN_EDITOR_PANE, editorWidth / 2),
    min: MIN_EDITOR_PANE,
    getMax: () => Math.max(MIN_EDITOR_PANE, editorWidth - MIN_EDITOR_PANE),
    enabled: editorGroups.groupCount > 1,
  })

  const SPLITTER_WIDTH = 6
  const availableWidth = Math.max(
    (editorGroups.groupCount === 2 ? editorWidth - SPLITTER_WIDTH : editorWidth),
    MIN_EDITOR_PANE * editorGroups.groupCount,
  )

  const setGroupCountWithMirror = useCallback(
    (count: 1 | 2) => {
      const fileId = currentFile?.id ?? fallbackFileId
      const previous = editorGroups.groupCount
      editorGroups.setExactGroupCount(count, editorGroups.activeGroup, fileId)
      if (count === 2 && previous !== 2) {
        const newAvailable = Math.max(editorWidth - SPLITTER_WIDTH, MIN_EDITOR_PANE * 2)
        splitOne.setSize(Math.max(MIN_EDITOR_PANE, newAvailable / 2))
      }
    },
    [SPLITTER_WIDTH, currentFile?.id, editorGroups, fallbackFileId, editorWidth, splitOne],
  )

  const handlePrimarySplitToggle = useCallback(() => {
    if (!isDesktop) return
    setGroupCountWithMirror(editorGroups.groupCount === 1 ? 2 : 1)
  }, [editorGroups.groupCount, isDesktop, setGroupCountWithMirror])

  const groupWidths = useMemo(() => {
    if (editorGroups.groupCount === 1) {
      return [availableWidth]
    }
    const maxFirst = availableWidth - MIN_EDITOR_PANE
    const first = Math.min(Math.max(MIN_EDITOR_PANE, splitOne.size), maxFirst)
    const second = Math.max(MIN_EDITOR_PANE, availableWidth - first)
    return [first, second]
  }, [availableWidth, editorGroups.groupCount, splitOne.size])

  const visibleGroups = useMemo(() => Array.from({ length: editorGroups.groupCount }, (_, index) => index as EditorGroupId), [editorGroups.groupCount])

  const renderSplitter = () => {
    const splitter = splitOne
    return (
      <div className="relative hidden h-full w-[6px] md:block">
        <div
          className={`absolute inset-y-0 left-0 w-[6px] cursor-col-resize rounded-sm transition-opacity ${splitter.isResizing ? 'opacity-100 bg-primary/40' : 'opacity-0 group-hover/editor:opacity-100 hover:bg-primary/30'
            }`}
          {...splitter.getHandleProps()}
          onDoubleClick={(event) => {
            event.preventDefault()
            const resetWidth = Math.max(MIN_EDITOR_PANE, availableWidth / 2)
            splitter.setSize(resetWidth)
          }}
        />
      </div>
    )
  }

  return (
    <div className={`flex h-full min-h-0 w-full flex-col overflow-hidden bg-surface pb-6 theme-${settings.theme} layout-${settings.layout}`}>
      <MacTitleBar
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setTerminalOpen((current) => !current)}
        editorMode={currentMode}
        onToggleEditorMode={handleToggleCurrentMode}
        canTogglePreview={Boolean(canTogglePreview)}
        splitToggle={{
          visible: isDesktop,
          isSplit: editorGroups.groupCount === 2,
          onToggle: handlePrimarySplitToggle,
        }}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ActivityBar
          activeView={workbench.activeView}
          onToggleExplorer={workbench.toggleExplorer}
          onSelectView={workbench.openView}
          onOpenProfile={() => handleOpenModalWithLoader(setProfileOpen)}
          onOpenSettings={() => handleOpenModalWithLoader(setSettingsOpen)}
        />
        <div className="hidden md:flex">
          {workbench.isLeftPanelOpen && (
            <div className="group/sidebar relative flex h-full" style={{ width: `${sidebarResize.size}px` }}>
              <LeftPanel
                view={workbench.activeView}
                files={portfolioFiles}
                openFiles={openFiles}
                activeId={currentFile?.id ?? ''}
                onSelectFile={handleOpenFile}
              />
              <div
                className={`absolute right-0 top-0 hidden h-full w-[6px] cursor-col-resize rounded-sm transition-opacity md:block ${sidebarResize.isResizing ? 'opacity-100 bg-primary/40' : 'opacity-0 group-hover/sidebar:opacity-100 hover:bg-primary/30'
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
          <div className="flex-1 min-h-0" ref={setEditorAreaElement}>
            <div className="group/editor flex h-full min-h-0 overflow-hidden">
              {visibleGroups.map((groupId, index) => {
                const fileId = editorGroups.activeTabByGroup[groupId]
                const groupTabIds = editorGroups.tabsByGroup[groupId]
                const groupTabs = groupTabIds
                  .map((tabId) => getFileById(tabId))
                  .filter((f): f is NonNullable<typeof f> => Boolean(f))
                const file = groupTabs.find((tab) => tab.id === fileId) ?? groupTabs[groupTabs.length - 1] ?? openFiles[0]
                const mode = editorGroups.modeByGroup[groupId] ?? 'preview'
                const canGroupToggle = file?.kind === 'tsx'
                return (
                  <Fragment key={`editor-group-${groupId}`}>
                    <div className="flex h-full min-h-0 min-w-0 flex-col" style={{ width: `${groupWidths[index]}px` }}>
                      <EditorGroup
                        tabs={groupTabs}
                        activeTabId={file?.id}
                        onSelectTab={(id) => handleSelectTab(groupId, id)}
                        onCloseTab={(id) => handleCloseTab(groupId, id)}
                        file={file}
                        mode={mode}
                        canTogglePreview={Boolean(canGroupToggle)}
                        onToggleMode={() => {
                          if (canGroupToggle) {
                            editorGroups.toggleGroupMode(groupId)
                          }
                        }}
                        onFocus={() => focusGroup(groupId)}
                        isFocused={editorGroups.activeGroup === groupId}
                      />
                    </div>
                    {index < visibleGroups.length - 1 && renderSplitter()}
                  </Fragment>
                )
              })}
            </div>
          </div>
          <TerminalPanel
            open={isTerminalOpen}
            onClose={() => setTerminalOpen(false)}
            files={portfolioFiles}
            onOpenFile={(id) => handleOpenFile(id)}
            theme={settings.theme}
            layout={settings.layout}
            setTheme={settings.setTheme}
            setLayout={settings.setLayout}
            links={links as Record<string, string | undefined>}
          />
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
              activeId={currentFile?.id ?? ''}
              onSelectFile={handleOpenFile}
              variant="overlay"
              onClose={workbench.closePanel}
            />
          </div>
        </div>
      )}
      <StatusBar />
      <CommandPalette open={isCommandPaletteOpen} onClose={closeCommandPalette} />
      {isLoaderOpen && <LoaderScreen />}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      <FloatingContact />
    </div>
  )
}
