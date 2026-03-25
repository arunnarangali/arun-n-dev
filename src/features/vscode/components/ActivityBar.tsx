import type { WorkbenchView } from '../state/useWorkbench'
import { Icon } from './Icon'

const primaryActions: Array<{ icon: string; view: WorkbenchView }> = [
  { icon: 'content_copy', view: 'explorer' },
  { icon: 'search', view: 'search' },
  { icon: 'account_tree', view: 'sourceControl' },
  { icon: 'extension', view: 'extensions' },
]

const utilityIcons = ['account_circle', 'settings']

type ActivityBarProps = {
  activeView: WorkbenchView
  onToggleExplorer: () => void
  onSelectView: (view: WorkbenchView) => void
}

export const ActivityBar = ({ activeView, onToggleExplorer, onSelectView }: ActivityBarProps) => {
  return (
    <aside className="flex w-12 flex-col items-center gap-4 border-r border-[#1B1B1C] bg-[#131313] py-4">
      {primaryActions.map(({ icon, view }) => {
        const isExplorerIcon = view === 'explorer'
        const isActive = activeView === view
        const baseClasses = 'p-2 transition-all duration-150 ease-in-out'
        const stateClasses = isActive
          ? 'border-l-2 border-primary bg-[#1B1B1C] text-on-surface'
          : 'text-secondary/60 hover:bg-[#2A2A2A] hover:text-on-surface'
        const handler = isExplorerIcon ? onToggleExplorer : () => onSelectView(view)
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
