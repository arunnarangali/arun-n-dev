import { useMemo, useState } from 'react'
import { runSearch, type SearchGroup, type SearchMatch } from '../../../../portfolio/searchIndex'
import { useSearchHighlight } from '../../state/useSearchHighlight'
import { useSettings } from '../../state/useSettings'
import { Icon } from '../Icon'

type SearchPanelProps = {
  onSelect: (id: string) => void
  variant?: 'sidebar' | 'overlay'
  onClose?: () => void
}

export const SearchPanel = ({ onSelect, variant = 'sidebar', onClose }: SearchPanelProps) => {
  const [query, setQuery] = useState('')
  const { setQuery: setHighlightQuery } = useSearchHighlight()
  const { layout } = useSettings()
  const results: SearchGroup[] = useMemo(() => (query.trim().length ? runSearch(query.trim()) : []), [query])

  return (
    <aside
      className={`flex flex-col bg-surface-container-low font-mono text-[11px] uppercase tracking-wider ${variant === 'overlay' ? 'h-full w-full' : 'w-full'
        }`}
    >
      <div className="px-4 py-3">
        <div className="relative">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setHighlightQuery(event.target.value)
            }}
            placeholder="Search portfolio..."
            className={[
              'w-full rounded bg-surface-container-lowest text-on-surface',
              layout === 'compact' ? 'px-3 py-1.5 text-xs pr-10' : 'px-3 py-2 text-sm pr-12',
            ].join(' ')}
          />
          <Icon
            name="search"
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none ${layout === 'compact' ? 'text-sm' : 'text-base'
              }`}
          />
        </div>
      </div>
      <div className="vscode-scrollbar flex-1 overflow-auto px-4 text-left normal-case text-xs text-on-surface">
        {results.length === 0 && <p className="px-2 py-4 text-on-surface-variant">Type to search across projects, experience, and skills.</p>}
        {results.map((group: SearchGroup) => (
          <div key={group.fileId} className="mb-4">
            <div className="mb-1 text-[10px] uppercase tracking-[0.4em] text-secondary/70">{group.fileName}</div>
            <div className="space-y-1">
              {group.matches.map((match: SearchMatch) => (
                <button
                  key={match.id}
                  onClick={() => {
                    onSelect(group.fileId)
                    if (variant === 'overlay') onClose?.()
                  }}
                  className="w-full rounded bg-surface-container-lowest px-2 py-2 text-left text-on-surface hover:bg-surface-container"
                >
                  <div className="text-[10px] text-secondary">
                    Line {match.line}
                  </div>
                  <p className="text-xs normal-case" dangerouslySetInnerHTML={{ __html: match.preview }} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
