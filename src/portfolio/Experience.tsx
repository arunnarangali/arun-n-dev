import { useSearchHighlight } from '../features/vscode/state/SearchContext'
import { highlightText } from '../features/vscode/utils/highlight'
import { experiences } from './content'

export const ExperienceSection = () => {
  const { query } = useSearchHighlight()
  return (
    <section className="mx-auto w-full max-w-7xl rounded-2xl border border-outline-variant bg-surface-container-low p-8 text-on-surface">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Experience</p>
        <h2 className="text-3xl font-semibold">Partnering with product & platform teams</h2>
      </header>
      <div className="relative pl-6">
        <span className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/70 to-transparent" />
        <div className="space-y-8">
          {experiences.map((entry) => (
            <article key={entry.company} className="relative pl-6">
              <span className="absolute -left-[10px] top-1 h-4 w-4 rounded-full border-2 border-emerald-400 bg-surface-container-low" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xl font-semibold">{highlightText(entry.title, query)}</h3>
                <p className="text-sm text-on-surface-variant">{entry.period}</p>
              </div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">{highlightText(entry.company, query)}</p>
              <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>• {highlightText(bullet, query)}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ExperienceSection
