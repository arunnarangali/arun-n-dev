import { useMemo, useState } from 'react'
import { runSearch, type SearchGroup, type SearchMatch } from '../../../../portfolio/searchIndex'
import { useSearchHighlight } from '../../state/SearchContext'

type SearchPanelProps = {
  onSelect: (id: string) => void
  variant?: 'sidebar' | 'overlay'
  onClose?: () => void
}

export const SearchPanel = ({ onSelect, variant = 'sidebar', onClose }: SearchPanelProps) => {
  const [query, setQuery] = useState('')
  const { setQuery: setHighlightQuery } = useSearchHighlight()
  const results: SearchGroup[] = useMemo(() => (query.trim().length ? runSearch(query.trim()) : []), [query])

  return (
    <aside
      className={`flex flex-col bg-[#1B1B1C] font-mono text-[11px] uppercase tracking-wider ${
        variant === 'overlay' ? 'h-full w-full' : 'w-72'
      }`}
    >
      <div className="px-4 py-3">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlightQuery(event.target.value)
          }}
          placeholder="Search portfolio..."
          className="w-full rounded bg-[#0f0f11] px-3 py-2 text-sm text-on-surface"
        />
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
                  className="w-full rounded bg-[#101012] px-2 py-2 text-left text-on-surface hover:bg-[#161618]"
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
