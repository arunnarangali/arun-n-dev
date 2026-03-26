import { Icon } from './Icon'

type BreadcrumbsProps = {
  path?: string[]
}

export const Breadcrumbs = ({ path = [] }: BreadcrumbsProps) => {
  if (path.length === 0) return null
  return (
    <div className="flex items-center gap-1 px-4 py-1 font-mono text-[11px] text-on-surface-variant/70">
      {path.map((segment, index) => {
        const isLast = index === path.length - 1
        return (
          <span key={`${segment}-${index}`} className="flex items-center gap-1">
            <span className={isLast ? 'text-primary' : undefined}>{segment}</span>
            {index < path.length - 1 && <Icon name="chevron_right" className="text-[12px] text-on-surface-variant/70" />}
          </span>
        )
      })}
    </div>
  )
}
