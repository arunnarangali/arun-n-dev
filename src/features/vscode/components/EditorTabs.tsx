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
      'vscode-scrollbar flex w-full min-w-0 overflow-x-auto bg-surface-container-low',
      layout === 'compact' ? 'h-8' : 'h-9',
    ].join(' ')}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        return (
          <div
            key={tab.id}
            className={[
              'group flex min-w-[120px] shrink-0 items-center justify-between font-mono cursor-pointer md:min-w-[150px]',
              layout === 'compact' ? 'px-2 text-[10px]' : 'px-3 text-[11px]',
              isActive ? 'border-t-2 border-primary bg-surface' : 'bg-surface-container-low hover:bg-surface-container',
            ].join(' ')}
            onClick={() => onSelect(tab.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon name={tab.icon} className={`text-[14px] ${isActive ? 'text-primary' : 'text-primary/60'}`} />
              <span
                className={[
                  'truncate max-w-[90px] sm:max-w-[120px] md:max-w-none',
                  isActive ? 'text-on-surface' : 'text-on-surface-variant',
                ].join(' ')}
              >
                {tab.name}
              </span>
            </div>
            <button
              className="rounded text-on-surface-variant opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-container-high"
              onClick={(event) => {
                event.stopPropagation()
                onClose(tab.id)
              }}
            >
              <Icon name="close" className="text-[14px]" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
