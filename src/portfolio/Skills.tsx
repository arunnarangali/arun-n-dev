import { skillGroups } from './content'

export const SkillsSection = () => {
  return (
    <section className="space-y-6 rounded-2xl border border-zinc-800/70 bg-[#161618] p-8 text-white">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Skills</p>
        <h2 className="text-3xl font-semibold">Systems thinking paired with pragmatic delivery</h2>
        <p className="text-sm text-zinc-400">Tooling and languages I reach for when building resilient front-ends.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {skillGroups.map((group) => (
          <article key={group.label} className="rounded-xl border border-zinc-800/60 bg-[#111113] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{group.label}</h3>
              <span className="rounded-full border border-zinc-700/80 px-3 py-1 text-xs text-zinc-400">{group.items.length}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
              {group.items.map((item) => (
                <span key={item} className="rounded-full bg-zinc-800/60 px-3 py-1 text-emerald-200/90">
                  {item}
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
