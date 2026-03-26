import { socials } from './content'

export const ContactSection = () => {
  return (
    <section id="contact" className="grid gap-6 rounded-2xl border border-outline-variant bg-surface-container-low p-8 text-on-surface lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Contact</p>
        <h2 className="text-3xl font-semibold">Let’s architect your next product sprint</h2>
        <p className="text-sm text-on-surface-variant">
          Share context about your roadmap, challenges, or team composition. I respond within two business days.
        </p>
        <form className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">Name</label>
            <input className="mt-1 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface" placeholder="Jane Product" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">Email</label>
            <input className="mt-1 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface" placeholder="you@company.com" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">Project Overview</label>
            <textarea className="mt-1 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface" rows={4} placeholder="Current challenges, timelines, teams..." />
          </div>
          <button className="w-full rounded-xl bg-emerald-500/90 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
            Send Message
          </button>
        </form>
      </div>
      <div className="space-y-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
        <h3 className="text-xl font-semibold">Open channels</h3>
        <ul className="space-y-3 text-sm text-on-surface-variant">
          {socials.map((link) => (
            <li key={link.label} className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">{link.label}</p>
                <p>{link.value}</p>
              </div>
              <a href={link.href} className="text-emerald-400 hover:text-emerald-300">
                ↗
              </a>
            </li>
          ))}
        </ul>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
          <p>Availability: GMT+5:30 • 15–20 hrs/wk</p>
          <p>Modes: Fractional leadership, deep-dive workshops, embedded squads</p>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
