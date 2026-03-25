import type { PortfolioFile } from '../data/files'
import { Icon } from './Icon'

type ExplorerProps = {
  files: PortfolioFile[]
  openFiles: PortfolioFile[]
  activeId: string
  onSelect: (id: string) => void
}

const gitBadgeColor: Record<'M' | 'U', string> = {
  M: 'text-[#E2C08D]',
  U: 'text-[#73C991]',
}

export const Explorer = ({ files, openFiles, activeId, onSelect }: ExplorerProps) => {
  return (
    <aside className="flex w-60 flex-col bg-[#1B1B1C] font-mono text-[11px] uppercase tracking-wider">
      <div className="flex items-center justify-between px-4 py-3 text-on-surface-variant">
        <span className="font-bold">Explorer: portfolio</span>
        <Icon name="more_horiz" className="text-[14px]" />
      </div>

      <div>
        <div className="flex items-center bg-[#2A2A2A] px-2 py-1 text-on-surface">
          <Icon name="expand_more" className="mr-1 text-[14px]" />
          <span className="font-bold">Open Editors</span>
        </div>
        {openFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => onSelect(file.id)}
            className="flex w-full items-center gap-2 px-6 py-1 text-left text-[#E5E2E1] hover:bg-[#2A2A2A]"
          >
            <Icon name={file.icon} className="text-[14px] text-primary" />
            <span className="lowercase">{file.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-2">
        <div className="flex items-center px-2 py-1 text-on-surface-variant">
          <Icon name="expand_more" className="mr-1 text-[14px]" />
          <span className="font-bold">portfolio</span>
        </div>
        <div className="flex flex-col">
          {files.map((file) => {
            const isActive = file.id === activeId
            return (
              <button
                key={file.id}
                onClick={() => onSelect(file.id)}
                className={[
                  'flex items-center justify-between px-6 py-1 text-left transition-colors',
                  isActive ? 'border-l-2 border-primary bg-[#2A2A2A] text-on-surface' : 'text-secondary/70 hover:bg-[#2A2A2A] hover:text-on-surface',
                ].join(' ')}
              >
                <span className="flex items-center gap-2">
                  <Icon name={file.icon} className="text-[14px] text-primary" />
                  <span className="lowercase">{file.name}</span>
                </span>
                {file.gitStatus && (
                  <span className={`text-[10px] font-bold ${gitBadgeColor[file.gitStatus]}`}>{file.gitStatus}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-auto p-4">
        <button className="w-full rounded bg-[#007ACC] py-2 text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-[#005A9E]">
          GET IN TOUCH
        </button>
      </div>
    </aside>
  )
}
