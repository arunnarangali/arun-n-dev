import { useMemo, useState } from 'react'
import { careerJourney, changeLog } from '../../../../portfolio/changelog'
import { scmInfo } from '../../../../portfolio/scm'
import { useSettings } from '../../state/useSettings'

type SourceControlPanelProps = {
  variant?: 'sidebar' | 'overlay'
}

export const SourceControlPanel = ({ variant = 'sidebar' }: SourceControlPanelProps) => {
  const [isCareerOpen, setCareerOpen] = useState(true)
  const [isChangelogOpen, setChangelogOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const { layout } = useSettings()

  const filteredCareer = useMemo(() => {
    if (!filter.trim()) return careerJourney
    const lower = filter.toLowerCase()
    return careerJourney.filter(
      (entry) =>
        entry.detail.toLowerCase().includes(lower) ||
        entry.company.toLowerCase().includes(lower) ||
        entry.role.toLowerCase().includes(lower) ||
        entry.year.toLowerCase().includes(lower),
    )
  }, [filter])

  const filteredChangelog = useMemo(() => {
    if (!filter.trim()) return changeLog
    const lower = filter.toLowerCase()
    return changeLog.filter((entry) => entry.message.toLowerCase().includes(lower) || entry.type.includes(lower))
  }, [filter])

  return (
    <aside
      className={`flex flex-col bg-surface-container-low font-mono text-[11px] uppercase tracking-wider ${
        variant === 'overlay' ? 'h-full w-full' : 'w-full'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 text-on-surface">
        <span className="text-[10px] tracking-[0.4em] text-secondary/70">SOURCE CONTROL</span>
        <div className="flex items-center gap-2 text-secondary">
          <span className="material-symbols-outlined text-[16px]">sync</span>
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span className="material-symbols-outlined text-[16px]">more_horiz</span>
        </div>
      </div>
      <div className="px-4 py-3 text-on-surface">
        <div className="rounded border border-outline-variant bg-surface-container-lowest px-3 py-2">
          <div className="flex items-center justify-between text-xs text-secondary/60">
            <span className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-[16px]">account_tree</span>
              {scmInfo.branchName}
            </span>
            <span className="text-[10px]">0↑ 0↓</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3">
        <textarea
          disabled
          placeholder="Add a milestone note…"
          className="h-16 w-full resize-none rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface placeholder:text-secondary/60"
        />
        <p className="mt-1 text-[10px] text-secondary/70">Portfolio commits capture promotions, launches, and impact.</p>
      </div>
      <div className="px-4 pb-3">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter entries"
          className={[
            'w-full rounded bg-surface-container-lowest text-on-surface placeholder:text-secondary/60',
            layout === 'compact' ? 'px-3 py-1.5 text-[11px]' : 'px-3 py-2 text-xs',
          ].join(' ')}
        />
      </div>
      <div className="vscode-scrollbar flex-1 overflow-auto px-4 text-left normal-case text-xs text-on-surface">
        <section className="mb-4">
          <button
            className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-secondary/80 hover:bg-surface-container"
            onClick={() => setCareerOpen((prev) => !prev)}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">
                {isCareerOpen ? 'expand_more' : 'chevron_right'}
              </span>
              Career Journey
            </span>
            <span className="text-[10px] text-secondary/60">{careerJourney.length}</span>
          </button>
            {isCareerOpen && (
              <div className="mt-2 space-y-3">
                {filteredCareer.map((entry) => (
                  <div key={entry.detail} className="rounded border border-outline-variant bg-surface-container-lowest p-3 shadow shadow-black/10">
                    <div className="flex items-center justify-between text-[10px] text-secondary/60">
                      <span>{entry.year}</span>
                      <span className="uppercase text-emerald-300">{entry.role}</span>
                    </div>
                    <p className="text-[11px] text-secondary/60">{entry.company}</p>
                    <p className="mt-1 text-xs text-on-surface">{entry.detail}</p>
                  </div>
                ))}
              </div>
            )}
        </section>

        <section>
          <button
            className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-secondary/80 hover:bg-surface-container"
            onClick={() => setChangelogOpen((prev) => !prev)}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">
                {isChangelogOpen ? 'expand_more' : 'chevron_right'}
              </span>
              Changelog
            </span>
            <span className="text-[10px] text-secondary/60">{changeLog.length}</span>
          </button>
          {isChangelogOpen && (
            <div className="mt-2 space-y-2">
              {filteredChangelog.map((log) => (
                <div key={log.message} className="flex flex-col rounded bg-surface-container-lowest px-3 py-2 text-on-surface">
                  <div className="flex items-center justify-between text-[10px] text-secondary/60">
                    <span className="uppercase text-emerald-300">{log.type}</span>
                    <span>{log.date}</span>
                  </div>
                  <p className="text-xs">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}
