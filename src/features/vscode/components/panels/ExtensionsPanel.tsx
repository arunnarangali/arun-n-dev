import { useMemo, useState } from 'react'
import { extensions, type ExtensionInfo } from '../../../../portfolio/extensions'
import { useSettings } from '../../state/useSettings'
import { Icon } from '../Icon'

type ExtensionsPanelProps = {
  variant?: 'sidebar' | 'overlay'
}

export const ExtensionsPanel = ({ variant = 'sidebar' }: ExtensionsPanelProps) => {
  const [query, setQuery] = useState('')
  const { layout } = useSettings()
  const filtered: ExtensionInfo[] = useMemo(() => {
    const lower = query.toLowerCase()
    return extensions.filter((ext) => ext.name.toLowerCase().includes(lower))
  }, [query])

  return (
    <aside
      className={`flex flex-col bg-surface-container-low font-mono text-[11px] uppercase tracking-wider ${
        variant === 'overlay' ? 'h-full w-full' : 'w-full'
      }`}
    >
      <div className="px-4 py-3 text-on-surface">
        <div className="relative">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search extensions"
            className={[
              'w-full rounded bg-surface-container-lowest text-on-surface',
              layout === 'compact' ? 'px-3 py-1.5 text-xs pr-10' : 'px-3 py-2 text-sm pr-12',
            ].join(' ')}
          />
          <Icon
            name="search"
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none ${
              layout === 'compact' ? 'text-sm' : 'text-base'
            }`}
          />
        </div>
      </div>
      <div className="vscode-scrollbar flex-1 overflow-auto px-4 text-left normal-case text-xs text-on-surface">
        {filtered.map((ext) => (
          <article
            key={ext.name}
            className={[
              'mb-2 rounded border border-outline-variant bg-surface-container-lowest shadow shadow-black/20 transition hover:border-accent/40',
              layout === 'compact' ? 'p-1.5' : 'p-2.5',
            ].join(' ')}
          >
            <div className="flex items-center gap-2">
              <img
                src={ext.icon}
                alt={ext.name}
                className={[
                  'rounded bg-surface-container-lowest object-contain',
                  layout === 'compact' ? 'h-7 w-7' : 'h-8 w-8',
                ].join(' ')}
              />
              <div className="flex-1">
                <h3 className={[layout === 'compact' ? 'text-[12px]' : 'text-[13px]', 'text-accent'].join(' ')}>{ext.name}</h3>
                <p
                  className={[
                    layout === 'compact' ? 'text-[10px]' : 'text-[11px]',
                    'mt-1 leading-snug text-on-surface-variant',
                  ].join(' ')}
                >
                  {ext.description}
                </p>
              </div>
              <span
                className={[
                  'rounded-full border border-primary/30 bg-primary/15 text-primary',
                  layout === 'compact' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
                ].join(' ')}
              >
                {ext.proficiency}/5
              </span>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}
