import { useSearchHighlight } from '../features/vscode/state/SearchContext'
import { highlightText } from '../features/vscode/utils/highlight'
import { skillGroups } from './content'

export const SkillsSection = () => {
  const { query } = useSearchHighlight()
  return (
    <section className="space-y-6 rounded-2xl border border-outline-variant bg-surface-container-low p-8 text-on-surface">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Skills</p>
        <h2 className="text-3xl font-semibold">Systems thinking paired with pragmatic delivery</h2>
        <p className="text-sm text-on-surface-variant">Tooling and languages I reach for when building resilient front-ends.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {skillGroups.map((group) => (
          <article key={group.label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{highlightText(group.label, query)}</h3>
              <span className="rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant">{group.items.length}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-on-surface-variant">
              {group.items.map((item) => (
                <span key={item} className="rounded-full bg-surface-container-high px-3 py-1 text-emerald-600">
                  {highlightText(item, query)}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default SkillsSection
