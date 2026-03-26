import type { PortfolioFile } from '../data/files'
import { EditorTabs } from './EditorTabs'
import { Breadcrumbs } from './Breadcrumbs'
import { EditorView } from './EditorView'

type EditorGroupProps = {
  tabs: PortfolioFile[]
  activeTabId?: string
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  file?: PortfolioFile
  mode: 'preview' | 'code'
  canTogglePreview: boolean
  onToggleMode: () => void
  onFocus: () => void
  isFocused: boolean
}

export const EditorGroup = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  file,
  mode,
  canTogglePreview,
  onToggleMode,
  onFocus,
  isFocused,
}: EditorGroupProps) => {
  return (
    <div className={`flex h-full flex-1 flex-col border border-transparent ${isFocused ? 'border-accent/40 bg-surface' : 'bg-surface'}`} onClick={onFocus}>
      <EditorTabs tabs={tabs} activeId={activeTabId ?? ''} onSelect={onSelectTab} onClose={onCloseTab} />
      <div className="flex items-center justify-between px-4 py-2">
        <Breadcrumbs path={file?.path} />
        {canTogglePreview && (
          <button
            onClick={(event) => {
              event.stopPropagation()
              onFocus()
              onToggleMode()
            }}
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/40 bg-surface-container-lowest text-emerald-500 shadow-lg shadow-black/30 transition hover:border-emerald-300"
            aria-label={mode === 'preview' ? 'View code' : 'View preview'}
            title={mode === 'preview' ? 'View code' : 'View preview'}
          >
            <span className="material-symbols-outlined">{mode === 'preview' ? 'code' : 'visibility'}</span>
          </button>
        )}
      </div>
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden" onClick={onFocus}>
        <EditorView file={file} mode={mode} />
      </div>
    </div>
  )
}
