import { Icon } from './Icon'

type BreadcrumbsProps = {
  path?: string[]
}

export const Breadcrumbs = ({ path = [] }: BreadcrumbsProps) => {
  if (path.length === 0) return null
  return (
    <div className="flex items-center gap-1.5 px-4 h-6 font-sans text-[12px] text-on-surface-variant/80">
      {path.map((segment, index) => {
        const isLast = index === path.length - 1
        return (
          <div key={`${segment}-${index}`} className="group flex items-center gap-1 cursor-pointer hover:bg-surface-container-high/60 px-1 rounded transition-colors h-full">
            <span className={`transition-colors group-hover:text-accent ${isLast ? 'text-on-surface font-semibold' : ''}`}>
              {segment}
            </span>
            {!isLast && (
              <Icon name="chevron_right" className="text-[14px] text-on-surface-variant/40" />
            )}
          </div>
        )
      })}
    </div>
  )
}
