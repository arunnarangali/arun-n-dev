import { experiences } from './content'

export const ExperienceSection = () => {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-[#171719] p-8 text-white">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Experience</p>
        <h2 className="text-3xl font-semibold">Partnering with product & platform teams</h2>
      </header>
      <div className="relative pl-6">
        <span className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/70 to-transparent" />
        <div className="space-y-8">
          {experiences.map((entry) => (
            <article key={entry.company} className="relative pl-6">
              <span className="absolute -left-[10px] top-1 h-4 w-4 rounded-full border-2 border-emerald-400 bg-[#171719]" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xl font-semibold">{entry.title}</h3>
                <p className="text-sm text-zinc-500">{entry.period}</p>
              </div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">{entry.company}</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
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
