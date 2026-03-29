import type { PortfolioFile } from '../data/files'
import { useResizablePanel } from '../hooks/useResizablePanel'
import { EditorTabs } from './EditorTabs'
import { Breadcrumbs } from './Breadcrumbs'
import { EditorView } from './EditorView'

type AuxEditorOverlayProps = {
  open: boolean
  tabs: PortfolioFile[]
  activeId: string
  mode: 'preview' | 'code'
  canTogglePreview: boolean
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onToggleMode: () => void
  onClose: () => void
}

const MIN_VIEWER_RATIO = 0.1
const CLOSE_RATIO = 0.15
const SNAP_POINTS = [0.5, 0.66, 0.85]

export const AuxEditorOverlay = ({
  open,
  tabs,
  activeId,
  mode,
  canTogglePreview,
  onSelectTab,
  onCloseTab,
  onToggleMode,
  onClose,
}: AuxEditorOverlayProps) => {
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
  const defaultHeight = Math.round(viewportHeight * 0.66)
  const minHeight = Math.max(120, Math.round(viewportHeight * MIN_VIEWER_RATIO))
  const closeThreshold = Math.round(viewportHeight * CLOSE_RATIO)
  const viewerResize = useResizablePanel({
    axis: 'y',
    storageKey: 'vscode-aux-viewer-height',
    defaultSize: defaultHeight,
    min: minHeight,
    getMax: ({ height }) => Math.max(minHeight, Math.round(height * 0.9)),
    enabled: open,
    invert: true,
    onResizeEnd: (size) => {
      if (size <= closeThreshold) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('vscode-aux-viewer-height')
        }
        onClose()
        return defaultHeight
      }
      const snapped = SNAP_POINTS
        .map((point) => Math.round(viewportHeight * point))
        .reduce((closest, candidate) => (Math.abs(candidate - size) < Math.abs(closest - size) ? candidate : closest))
      return snapped
    },
  })

  if (!open) return null

  const file = tabs.find((tab) => tab.id === activeId) ?? tabs[tabs.length - 1]

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border border-outline-variant bg-surface-container-low shadow-2xl"
        style={{ height: `${viewerResize.size}px` }}
      >
        <div className="relative flex h-6 items-center justify-center">
          <div
            className={`h-1.5 w-48 touch-none rounded-full bg-outline/50 transition-opacity ${viewerResize.isResizing ? 'opacity-100' : 'opacity-70'}`}
            {...viewerResize.getHandleProps()}
            aria-label="Resize viewer"
          />
        </div>
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span className="font-mono uppercase tracking-[0.3em]">Quick View</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Close viewer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <EditorTabs tabs={tabs} activeId={activeId} onSelect={onSelectTab} onClose={onCloseTab} />
        <div className="flex items-center justify-between px-4 py-2">
          <Breadcrumbs path={file?.path} />
          {canTogglePreview && (
            <button
              onClick={onToggleMode}
              className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/40 bg-surface-container-lowest text-emerald-500 shadow-lg shadow-black/30 transition hover:border-emerald-300"
              aria-label={mode === 'preview' ? 'View code' : 'View preview'}
              title={mode === 'preview' ? 'View code' : 'View preview'}
            >
              <span className="material-symbols-outlined">{mode === 'preview' ? 'code' : 'visibility'}</span>
            </button>
          )}
        </div>
        <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
          <EditorView file={file} mode={mode} />
        </div>
      </div>
    </div>
  )
}
