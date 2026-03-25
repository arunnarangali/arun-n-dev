import { Icon } from './Icon'

const primaryIcons = ['content_copy', 'search', 'account_tree', 'extension']
const utilityIcons = ['account_circle', 'settings']

type ActivityBarProps = {
  explorerActive: boolean
  onToggleExplorer: () => void
}

export const ActivityBar = ({ explorerActive, onToggleExplorer }: ActivityBarProps) => {
  return (
    <aside className="flex w-12 flex-col items-center gap-4 border-r border-[#1B1B1C] bg-[#131313] py-4">
      {primaryIcons.map((icon, index) => {
        const isExplorerIcon = index === 0
        const isActive = isExplorerIcon && explorerActive
        const baseClasses = 'p-2 transition-all duration-150 ease-in-out'
        const stateClasses = isActive
          ? 'border-l-2 border-primary bg-[#1B1B1C] text-on-surface'
          : 'text-secondary/60 hover:bg-[#2A2A2A] hover:text-on-surface'
        const handler = isExplorerIcon ? onToggleExplorer : undefined
        return (
          <button
            key={icon}
            onClick={handler}
            className={[baseClasses, stateClasses].join(' ')}
          >
            <Icon name={icon} />
          </button>
        )
      })}
      <div className="mt-auto flex flex-col items-center gap-4">
        {utilityIcons.map((icon) => (
          <button
            key={icon}
            className="p-2 text-secondary/60 transition-all duration-150 ease-in-out hover:bg-[#2A2A2A] hover:text-on-surface"
          >
            <Icon name={icon} />
          </button>
        ))}
      </div>
    </aside>
  )
}
