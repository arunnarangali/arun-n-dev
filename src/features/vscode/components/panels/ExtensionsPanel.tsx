import { useMemo, useState } from 'react'
import { extensions, type ExtensionInfo } from '../../../../portfolio/extensions'

type ExtensionsPanelProps = {
  variant?: 'sidebar' | 'overlay'
}

export const ExtensionsPanel = ({ variant = 'sidebar' }: ExtensionsPanelProps) => {
  const [query, setQuery] = useState('')
  const filtered: ExtensionInfo[] = useMemo(() => {
    const lower = query.toLowerCase()
    return extensions.filter((ext) => ext.name.toLowerCase().includes(lower))
  }, [query])

  return (
    <aside
      className={`flex flex-col bg-[#1B1B1C] font-mono text-[11px] uppercase tracking-wider ${
        variant === 'overlay' ? 'h-full w-full' : 'w-72'
      }`}
    >
      <div className="px-4 py-3 text-on-surface">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search extensions"
          className="w-full rounded bg-[#0f0f11] px-3 py-2 text-sm text-on-surface"
        />
      </div>
      <div className="vscode-scrollbar flex-1 overflow-auto px-4 text-left normal-case text-xs text-on-surface">
        {filtered.map((ext) => (
          <article
            key={ext.name}
            className="mb-3 rounded border border-[#2a2a2a] bg-[#131316] p-3 shadow shadow-black/20 transition hover:border-emerald-400/40"
          >
            <div className="flex items-center gap-3">
              <img src={ext.icon} alt={ext.name} className="h-8 w-8 rounded bg-[#0f0f11] object-contain" />
              <div className="flex-1">
                <h3 className="text-sm text-white">{ext.name}</h3>
                <p className="mt-1 text-xs text-zinc-400">{ext.description}</p>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200">{ext.proficiency}/5</span>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}
