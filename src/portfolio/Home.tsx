import { heroContent } from './content'

export const HomeSection = () => {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-10 rounded-2xl border border-zinc-800/80 bg-[#1d1d1f] p-6 text-white shadow-2xl shadow-black/40 md:p-10">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Portfolio / Home.tsx</p>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{heroContent.title}</h1>
        <p className="max-w-3xl text-lg text-zinc-400">{heroContent.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {heroContent.ctas.map((cta) => (
          <a
            key={cta.label}
            href={cta.href}
            className={[
              'inline-flex items-center rounded-full border px-5 py-2 text-sm font-semibold transition-all',
              cta.variant === 'ghost'
                ? 'border-zinc-700/70 text-zinc-200 hover:border-zinc-500'
                : 'border-transparent bg-emerald-500/90 text-black hover:bg-emerald-400',
            ].join(' ')}
          >
            {cta.label}
          </a>
        ))}
      </div>

      <div className="grid gap-4 rounded-2xl border border-zinc-800/60 bg-[#141416] p-6 md:grid-cols-3">
        {heroContent.metrics.map((metric) => (
          <div key={metric.label} className="space-y-1">
            <div className="text-3xl font-bold text-emerald-400">{metric.value}</div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HomeSection
