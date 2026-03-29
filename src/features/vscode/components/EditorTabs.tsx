import type { PortfolioFile } from '../data/files'
import { Icon } from './Icon'
import { useSettings } from '../state/useSettings'

type EditorTabsProps = {
  tabs: PortfolioFile[]
  activeId: string
  onSelect: (id: string) => void
  onClose: (id: string) => void
}

export const EditorTabs = ({ tabs, activeId, onSelect, onClose }: EditorTabsProps) => {
  const { layout } = useSettings()
  return (
    <div className={[
      'vscode-scrollbar flex w-full min-w-0 overflow-x-auto bg-surface-container-low border-b border-outline-variant/30',
      layout === 'compact' ? 'h-[28px]' : 'h-[35px]',
    ].join(' ')}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        return (
          <div
            key={tab.id}
            className={[
              'group flex min-w-[100px] sm:min-w-[120px] md:min-w-[140px] shrink-0 items-center justify-between font-sans font-medium cursor-pointer transition-colors border-r border-outline-variant/20',
              layout === 'compact' ? 'px-2 text-[11px]' : 'px-3 text-[12px]',
              isActive ? 'bg-surface text-primary border-t-[2px] border-t-primary' : 'bg-surface-container-low text-on-surface-variant/70 hover:bg-surface-container hover:text-accent',
            ].join(' ')}
            onClick={() => onSelect(tab.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon name={tab.icon} className={`text-[16px] ${isActive ? 'text-primary' : 'text-primary/60'}`} />
              <span className="truncate max-w-[90px] sm:max-w-[120px] md:max-w-none lowercase transition-colors group-hover:text-accent">
                {tab.name}
              </span>
            </div>
            <button
              className={`rounded-md p-0.5 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-accent ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={(event) => {
                event.stopPropagation()
                onClose(tab.id)
              }}
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
