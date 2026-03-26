import type { WorkbenchView } from '../state/useWorkbench'
import { Icon } from './Icon'

const primaryActions: Array<{ icon: string; view: WorkbenchView }> = [
  { icon: 'content_copy', view: 'explorer' },
  { icon: 'search', view: 'search' },
  { icon: 'account_tree', view: 'sourceControl' },
  { icon: 'extension', view: 'extensions' },
]

type ActivityBarProps = {
  activeView: WorkbenchView
  onToggleExplorer: () => void
  onSelectView: (view: WorkbenchView) => void
  onOpenProfile: () => void
  onOpenSettings: () => void
}

export const ActivityBar = ({
  activeView,
  onToggleExplorer,
  onSelectView,
  onOpenProfile,
  onOpenSettings,
}: ActivityBarProps) => {
  return (
    <aside className="flex w-12 flex-col items-center gap-4 border-r border-outline-variant bg-surface py-4">
      {primaryActions.map(({ icon, view }) => {
        const isExplorerIcon = view === 'explorer'
        const isActive = activeView === view
        const baseClasses = 'p-2 transition-all duration-150 ease-in-out'
        const stateClasses = isActive
          ? 'border-l-2 border-primary bg-surface-container-low text-on-surface'
          : 'text-secondary/60 hover:bg-surface-container-high hover:text-on-surface'
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
        <button
          onClick={onOpenProfile}
          className="p-2 text-secondary/60 transition-all duration-150 ease-in-out hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="account_circle" />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2 text-secondary/60 transition-all duration-150 ease-in-out hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="settings" />
        </button>
      </div>
    </aside>
  )
}
