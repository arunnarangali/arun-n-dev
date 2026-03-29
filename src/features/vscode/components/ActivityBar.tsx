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
    <aside className="flex w-12 flex-col items-center border-r border-outline-variant bg-surface py-2">
      <div className="flex w-full flex-col items-center">
        {primaryActions.map(({ icon, view }) => {
          const isExplorerIcon = view === 'explorer'
          const isActive = activeView === view
          const handler = isExplorerIcon ? onToggleExplorer : () => onSelectView(view)
          return (
            <div key={icon} className="relative flex h-12 w-full items-center justify-center">
              {isActive && (
                <div className="absolute left-0 h-8 w-[2px] bg-primary" />
              )}
              <button
                onClick={handler}
                className={`flex h-10 w-10 items-center justify-center rounded-md transition-all duration-150 ${
                  isActive 
                    ? 'text-on-surface' 
                    : 'text-on-surface-variant/60 hover:text-accent'
                }`}
              >
                <Icon name={icon} className="text-[24px]" />
              </button>
            </div>
          )
        })}
      </div>
      <div className="mt-auto flex w-full flex-col items-center pb-2">
        <div className="flex h-12 w-full items-center justify-center">
          <button
            onClick={onOpenProfile}
            className="flex h-10 w-10 items-center justify-center rounded-md text-on-surface-variant/60 transition-all duration-150 hover:text-accent"
          >
            <Icon name="account_circle" className="text-[24px]" />
          </button>
        </div>
        <div className="flex h-12 w-full items-center justify-center">
          <button
            onClick={onOpenSettings}
            className="flex h-10 w-10 items-center justify-center rounded-md text-on-surface-variant/60 transition-all duration-150 hover:text-accent"
          >
            <Icon name="settings" className="text-[24px]" />
          </button>
        </div>
      </div>
    </aside>
  )
}
