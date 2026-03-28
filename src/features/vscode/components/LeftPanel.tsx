import { Explorer } from './Explorer'
import { SearchPanel } from './panels/SearchPanel'
import { SourceControlPanel } from './panels/SourceControlPanel'
import { ExtensionsPanel } from './panels/ExtensionsPanel'
import type { PortfolioFile } from '../data/files'

type LeftPanelProps = {
  view: string
  files: PortfolioFile[]
  openFiles: PortfolioFile[]
  activeId: string
  onSelectFile: (id: string) => void
  variant?: 'sidebar' | 'overlay'
  onClose?: () => void
}

const overlayTitles: Record<string, string> = {
  search: 'SEARCH',
  sourceControl: 'SOURCE CONTROL',
  extensions: 'EXTENSIONS',
}

export const LeftPanel = ({ view, files, openFiles, activeId, onSelectFile, variant = 'sidebar', onClose }: LeftPanelProps) => {
  const isOverlay = variant === 'overlay'
  const renderPanel = () => {
    if (view === 'search') {
      return <SearchPanel onSelect={onSelectFile} variant={variant} onClose={onClose} />
    }
    if (view === 'sourceControl') {
      return <SourceControlPanel variant={variant} />
    }
    if (view === 'extensions') {
      return <ExtensionsPanel variant={variant} />
    }
    return (
      <Explorer
        files={files}
        openFiles={openFiles}
        activeId={activeId}
        onSelect={onSelectFile}
        variant={variant}
        onClose={onClose}
      />
    )
  }

  if (isOverlay && overlayTitles[view]) {
    return (
      <div className="flex h-full w-full flex-col bg-surface-container-low font-mono text-[11px] uppercase tracking-wider">
        <div className="flex items-center justify-between px-4 py-3 text-on-surface">
          <span className="font-bold text-secondary/80">{overlayTitles[view]}</span>
          <button onClick={onClose} className="rounded p-1 text-secondary hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="vscode-scrollbar flex-1 overflow-auto">{renderPanel()}</div>
      </div>
    )
  }

  return renderPanel()
}
