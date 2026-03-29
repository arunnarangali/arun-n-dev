import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getFileById, portfolioFiles, type PortfolioFile } from '../../features/vscode/data/files'
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
import { TerminalPanel } from '../../features/vscode/components/panels/TerminalPanel'
import links from '../../portfolio/data/links.json'
import { useResizablePanel } from '../../features/vscode/hooks/useResizablePanel'
import { useEditorGroups, type EditorGroupId } from '../../features/vscode/state/useEditorGroups'
import { EditorGroup } from '../../features/vscode/components/EditorGroup'
import { EditorTabs } from '../../features/vscode/components/EditorTabs'
import { Breadcrumbs } from '../../features/vscode/components/Breadcrumbs'
import { SinglePageEditor, type SinglePageEditorHandle } from '../../features/vscode/components/SinglePageEditor'
import { AuxEditorOverlay } from '../../features/vscode/components/AuxEditorOverlay'
import { useElementSize } from '../../features/vscode/hooks/useElementSize'

const SIDEBAR_DEFAULT_WIDTH = 240
const MIN_EDITOR_PANE_DESKTOP = 320
const MIN_EDITOR_PANE_MOBILE = 280

export const VSCodePortfolio = () => {
  const workbench = useWorkbench()
  const settings = useSettings()
  const [isProfileOpen, setProfileOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [isTerminalOpen, setTerminalOpen] = useState(() => !settings.singlePage)
  const [terminalFocusSignal, setTerminalFocusSignal] = useState(0)
  const [commandFeedback, setCommandFeedback] = useState('')
  const [auxTabs, setAuxTabs] = useState<string[]>([])
  const [auxActiveId, setAuxActiveId] = useState('')
  const [auxMode, setAuxMode] = useState<'preview' | 'code'>('preview')
  const [isAuxOpen, setAuxOpen] = useState(false)
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
  const singlePageEditorRef = useRef<SinglePageEditorHandle>(null)
  const tsxFiles = useMemo(() => portfolioFiles.filter((file) => file.kind === 'tsx'), [])
  const fallbackFileId = useMemo(() => openFiles[0]?.id ?? portfolioFiles[0]?.id ?? '', [openFiles])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const desktopQuery = window.matchMedia('(min-width: 768px)')
    const updateDesktop = (event?: MediaQueryListEvent) => {
      const matches = event ? event.matches : desktopQuery.matches
      if (!matches && settings.singlePage && editorGroups.groupCount > 1) {
        const rightTabs = editorGroups.tabsByGroup[1] ?? []
        if (rightTabs.length) {
          setAuxTabs(rightTabs)
          setAuxActiveId(editorGroups.activeTabByGroup[1] ?? rightTabs[0])
          setAuxMode(editorGroups.modeByGroup[1] ?? 'preview')
          setAuxOpen(true)
        }
        setExactGroupCount(1, 0, fallbackFileId)
      }
      setIsDesktop(matches)
    }
    updateDesktop()
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', updateDesktop)
      return () => desktopQuery.removeEventListener('change', updateDesktop)
    }
    desktopQuery.addListener(updateDesktop)
    return () => desktopQuery.removeListener(updateDesktop)
  }, [
    editorGroups.activeTabByGroup,
    editorGroups.groupCount,
    editorGroups.modeByGroup,
    editorGroups.tabsByGroup,
    fallbackFileId,
    setExactGroupCount,
    settings.singlePage,
  ])

  useEffect(() => {
    if (!isDesktop && editorGroups.groupCount > 1) {
      setExactGroupCount(1, editorGroups.activeGroup, fallbackFileId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, fallbackFileId, setExactGroupCount])

  useEffect(() => {
    if (!settings.singlePage) return
    if (editorGroups.groupCount > 1 && (editorGroups.tabsByGroup[1] ?? []).length === 0) {
      setExactGroupCount(1, 0, fallbackFileId)
    }
    setActiveGroup(0)
  }, [editorGroups.groupCount, editorGroups.tabsByGroup, fallbackFileId, setActiveGroup, setExactGroupCount, settings.singlePage])

  useEffect(() => {
    if (settings.singlePage) {
      setTerminalOpen(false)
    }
  }, [settings.singlePage])

  useEffect(() => {
    if (!fallbackFileId) return
    ensureTabsValid(
      openFiles.map((file) => file.id),
      fallbackFileId,
    )
  }, [openFiles, fallbackFileId, ensureTabsValid])

  useEffect(() => {
    if (!commandFeedback) return
    const timeout = window.setTimeout(() => setCommandFeedback(''), 1800)
    return () => window.clearTimeout(timeout)
  }, [commandFeedback])

  const handleOpenFile = useCallback(
    (id: string, targetGroup: EditorGroupId = editorGroups.activeGroup) => {
      const file = getFileById(id)
      if (settings.singlePage && file?.kind !== 'tsx') {
        addToOpenTabs(id)
        if (!isDesktop) {
          setAuxTabs((current) => (current.includes(id) ? current : [...current, id]))
          setAuxActiveId(id)
          setAuxMode('preview')
          setAuxOpen(true)
          return
        }
        if (editorGroups.groupCount === 1) {
          setExactGroupCount(2, 1)
        }
        setActiveTabForGroup(1, id)
        setActiveGroup(1)
        return
      }
      const groupId = settings.singlePage ? 0 : targetGroup
      addToOpenTabs(id)
      setActiveTabForGroup(groupId, id)
      setActiveGroup(groupId)
      if (settings.singlePage && file?.kind === 'tsx') {
        singlePageEditorRef.current?.scrollToSection(id)
      }
    },
    [
      addToOpenTabs,
      editorGroups.activeGroup,
      editorGroups.groupCount,
      isDesktop,
      setActiveGroup,
      setActiveTabForGroup,
      setExactGroupCount,
      settings.singlePage,
    ],
  )


  const handleSelectTab = useCallback(
    (groupId: EditorGroupId, id: string) => {
      const file = getFileById(id)
      if (settings.singlePage && file?.kind !== 'tsx') {
        if (!isDesktop) {
          setAuxTabs((current) => (current.includes(id) ? current : [...current, id]))
          setAuxActiveId(id)
          setAuxMode('preview')
          setAuxOpen(true)
          return
        }
        if (editorGroups.groupCount === 1) {
          setExactGroupCount(2, 1)
        }
        setActiveTabForGroup(1, id)
        setActiveGroup(1)
        return
      }
      const targetGroup = settings.singlePage ? 0 : groupId
      setActiveTabForGroup(targetGroup, id)
      setActiveGroup(targetGroup)
      if (settings.singlePage && file?.kind === 'tsx') {
        singlePageEditorRef.current?.scrollToSection(id)
      }
    },
    [
      editorGroups.groupCount,
      isDesktop,
      setActiveGroup,
      setActiveTabForGroup,
      setExactGroupCount,
      settings.singlePage,
    ],
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
  const groupZeroFileId = editorGroups.activeTabByGroup[0]
  const groupZeroFile = useMemo(() => getFileById(groupZeroFileId) ?? openFiles[0], [groupZeroFileId, openFiles])
  const currentMode = editorGroups.modeByGroup[currentGroupId] ?? 'preview'
  const isReadmeMarkdown = (file?: PortfolioFile) => file?.kind === 'markdown' && file?.id === 'portfolio/README.md'
  const showSinglePageScrollView = settings.singlePage
  const canTogglePreview = !(settings.singlePage && editorGroups.activeGroup === 0) &&
    (currentFile?.kind === 'tsx' || isReadmeMarkdown(currentFile))
  const auxFiles = useMemo(
    () => auxTabs.map((tabId) => getFileById(tabId)).filter((file): file is NonNullable<typeof file> => Boolean(file)),
    [auxTabs],
  )
  const auxActiveFile = useMemo(() => getFileById(auxActiveId), [auxActiveId])
  const canToggleAuxPreview = auxActiveFile?.kind === 'tsx' || isReadmeMarkdown(auxActiveFile)

  const handleToggleCurrentMode = () => {
    if (!canTogglePreview) return
    toggleGroupMode(currentGroupId)
  }

  const handleSectionActive = useCallback(
    (id: string) => {
      if (!settings.singlePage) return
      addToOpenTabs(id)
      setActiveTabForGroup(0, id)
      setActiveGroup(0)
    },
    [addToOpenTabs, setActiveGroup, setActiveTabForGroup, settings.singlePage],
  )

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isCmdOrCtrl = event.metaKey || event.ctrlKey
      const isShiftAlt = event.shiftKey && event.altKey

      if (isCmdOrCtrl && event.shiftKey && key === 'p') {
        event.preventDefault()
        toggleCommandPalette()
        return
      }

      if (key === 'escape') {
        closeCommandPalette()
        return
      }

      if (isCmdOrCtrl && event.code === 'Backquote' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        setTerminalOpen(true)
        setTerminalFocusSignal((signal) => signal + 1)
        return
      }

      if (isCmdOrCtrl && isShiftAlt) {
        if (key === 'f') {
          event.preventDefault()
          workbench.openView('search')
          return
        }
        if (key === 't') {
          event.preventDefault()
          setSettingsOpen(true)
          return
        }
        if (key === 'b') {
          event.preventDefault()
          workbench.toggleLeftPanel()
          return
        }
        if (key === 'l') {
          event.preventDefault()
          if (currentFile && currentMode === 'code') {
            setCommandFeedback('Document formatted.')
          } else {
            setCommandFeedback('Format works in code view only.')
          }
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    closeCommandPalette,
    currentFile,
    currentMode,
    setCommandFeedback,
    setSettingsOpen,
    setTerminalFocusSignal,
    setTerminalOpen,
    toggleCommandPalette,
    workbench,
  ])

  const pushCommandFeedback = useCallback((message: string) => {
    setCommandFeedback(message)
  }, [])

  const handleCommandSelect = useCallback(
    (id: string) => {
      switch (id) {
        case 'find-in-files':
          workbench.openView('search')
          break
        case 'open-theme':
          setSettingsOpen(true)
          break
        case 'focus-terminal':
          setTerminalOpen(true)
          setTerminalFocusSignal((signal) => signal + 1)
          break
        case 'toggle-sidebar':
          workbench.toggleLeftPanel()
          break
        case 'format-document':
          if (currentFile && currentMode === 'code') {
            pushCommandFeedback('Document formatted.')
          } else {
            pushCommandFeedback('Format works in code view only.')
          }
          break
        default:
          break
      }
      closeCommandPalette()
    },
    [closeCommandPalette, currentFile, currentMode, pushCommandFeedback, workbench],
  )

  const MIN_EDITOR_PANE = isDesktop ? MIN_EDITOR_PANE_DESKTOP : MIN_EDITOR_PANE_MOBILE

  const sidebarResize = useResizablePanel({
    axis: 'x',
    storageKey: 'vscode-sidebar-width',
    defaultSize: SIDEBAR_DEFAULT_WIDTH,
    min: 200,
    getMax: ({ width }) => Math.min(520, width * 0.5),
    enabled: workbench.isLeftPanelOpen && isDesktop,
  })

  const sidebarHandleProps = sidebarResize.getHandleProps()

  const editorWidthFallback = typeof window !== 'undefined' ? window.innerWidth - (isDesktop ? SIDEBAR_DEFAULT_WIDTH : 0) : 1200
  const editorWidth = Math.max(editorAreaSize.width || editorWidthFallback, MIN_EDITOR_PANE * editorGroups.groupCount)

  const splitOne = useResizablePanel({
    axis: 'x',
    storageKey: 'vscode-editor-split-1',
    defaultSize: Math.max(MIN_EDITOR_PANE, editorWidth / 2),
    min: MIN_EDITOR_PANE,
    getMax: () => Math.max(MIN_EDITOR_PANE, editorWidth - MIN_EDITOR_PANE),
    enabled: editorGroups.groupCount > 1 && isDesktop,
  })

  const SPLITTER_WIDTH = 6
  const availableWidth = isDesktop 
    ? Math.max(
        (editorGroups.groupCount === 2 ? editorWidth - SPLITTER_WIDTH : editorWidth),
        MIN_EDITOR_PANE * editorGroups.groupCount,
      )
    : (editorAreaSize.width || window.innerWidth)

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
    [SPLITTER_WIDTH, currentFile?.id, editorGroups, fallbackFileId, editorWidth, splitOne, MIN_EDITOR_PANE],
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
  }, [availableWidth, editorGroups.groupCount, splitOne.size, MIN_EDITOR_PANE])

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
            visible: isDesktop && !settings.singlePage,
            isSplit: editorGroups.groupCount === 2,
            onToggle: handlePrimarySplitToggle,
          }}
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
              {showSinglePageScrollView ? (
                <>
                  <div className="flex h-full min-h-0 min-w-0 flex-col" style={{ width: isDesktop ? `${groupWidths[0] ?? availableWidth}px` : '100%' }}>
                    <EditorTabs
                      tabs={(editorGroups.tabsByGroup[0] ?? [])
                        .map((tabId) => getFileById(tabId))
                        .filter((f): f is NonNullable<typeof f> => Boolean(f))}
                      activeId={editorGroups.activeTabByGroup[0] ?? ''}
                      onSelect={(id) => handleSelectTab(0, id)}
                      onClose={(id) => handleCloseTab(0, id)}
                    />
                    <div className="flex items-center justify-between px-4 py-2">
                      <Breadcrumbs path={groupZeroFile?.path} />
                    </div>
                    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
                      <SinglePageEditor ref={singlePageEditorRef} files={tsxFiles} onActiveSection={handleSectionActive} />
                    </div>
                  </div>
                  {editorGroups.groupCount === 2 && (
                    <>
                      {renderSplitter()}
                      {(() => {
                        const groupId: EditorGroupId = 1
                        const fileId = editorGroups.activeTabByGroup[groupId]
                        const groupTabIds = editorGroups.tabsByGroup[groupId]
                        const groupTabs = groupTabIds
                          .map((tabId) => getFileById(tabId))
                          .filter((f): f is NonNullable<typeof f> => Boolean(f))
                        const file = groupTabs.find((tab) => tab.id === fileId) ?? groupTabs[groupTabs.length - 1] ?? openFiles[0]
                        const mode = editorGroups.modeByGroup[groupId] ?? 'preview'
                        const canGroupToggle = file?.kind === 'tsx' || isReadmeMarkdown(file)
                        const groupWidth = groupWidths[1] ?? MIN_EDITOR_PANE
                        return (
                          <div className="flex h-full min-h-0 min-w-0 flex-col" style={{ width: isDesktop ? `${groupWidth}px` : '100%' }}>
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
                        )
                      })()}
                    </>
                  )}
                </>
              ) : (
                visibleGroups.map((groupId, index) => {
                  const fileId = editorGroups.activeTabByGroup[groupId]
                  const groupTabIds = editorGroups.tabsByGroup[groupId]
                  const groupTabs = groupTabIds
                    .map((tabId) => getFileById(tabId))
                    .filter((f): f is NonNullable<typeof f> => Boolean(f))
                  const file = groupTabs.find((tab) => tab.id === fileId) ?? groupTabs[groupTabs.length - 1] ?? openFiles[0]
                  const mode = editorGroups.modeByGroup[groupId] ?? 'preview'
                  const canGroupToggle = file?.kind === 'tsx' || isReadmeMarkdown(file)
                  const groupWidth = groupWidths[index]
                  return (
                    <Fragment key={`editor-group-${groupId}`}>
                      <div className="flex h-full min-h-0 min-w-0 flex-col" style={{ width: isDesktop ? `${groupWidth}px` : '100%' }}>
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
                })
              )}
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
          focusSignal={terminalFocusSignal}
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
      <AuxEditorOverlay
        open={isAuxOpen && auxFiles.length > 0}
        tabs={auxFiles}
        activeId={auxActiveId}
        mode={auxMode}
        canTogglePreview={Boolean(canToggleAuxPreview)}
        onSelectTab={(id) => setAuxActiveId(id)}
        onCloseTab={(id) => {
          setAuxTabs((current) => {
            const next = current.filter((tabId) => tabId !== id)
            if (next.length === 0) {
              setAuxOpen(false)
              setAuxActiveId('')
              setAuxMode('preview')
            } else if (auxActiveId === id) {
              setAuxActiveId(next[next.length - 1])
            }
            const stillOpenInGroups = (editorGroups.tabsByGroup[0] ?? []).includes(id) ||
              (editorGroups.tabsByGroup[1] ?? []).includes(id)
            if (!stillOpenInGroups) {
              closeFile(id)
            }
            return next
          })
        }}
        onToggleMode={() => setAuxMode((mode) => (mode === 'preview' ? 'code' : 'preview'))}
        onClose={() => {
          setAuxOpen(false)
          setAuxTabs([])
          setAuxActiveId('')
          setAuxMode('preview')
        }}
      />
      {commandFeedback && (
        <div className="fixed bottom-8 right-4 z-50 rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-xs text-on-surface shadow-lg">
          {commandFeedback}
        </div>
      )}
      <StatusBar />
      {isCommandPaletteOpen && (
        <CommandPalette open={isCommandPaletteOpen} onClose={closeCommandPalette} onSelectCommand={handleCommandSelect} />
      )}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      <FloatingContact />
    </div>
  )
}
