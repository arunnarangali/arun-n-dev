import profileImg from '../assets/hero.png'
import { aboutContent } from './content'

export const AboutSection = () => {
  return (
    <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-2xl border border-zinc-800/70 bg-[#18181a] p-6 text-white md:grid-cols-[260px,1fr] md:p-8">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-40 w-40 overflow-hidden rounded-full border border-zinc-700/80">
          <img src={profileImg} alt="Arun Narangali" className="h-full w-full object-cover" />
        </div>
        <h2 className="text-2xl font-semibold">{aboutContent.name}</h2>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">{aboutContent.role}</p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-zinc-400">
          {aboutContent.highlights.map((item) => (
            <span key={item} className="rounded-full border border-zinc-700/70 px-3 py-1">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-6 text-zinc-300">
        <p className="text-lg leading-relaxed text-zinc-200">{aboutContent.bio}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-zinc-800/80 bg-[#131316] p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-600">Ops models</p>
            <p className="text-sm text-zinc-300">Fractional leadership • Workshops • Embedded squads</p>
          </article>
          <article className="rounded-xl border border-zinc-800/80 bg-[#131316] p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-600">Focus</p>
            <p className="text-sm text-zinc-300">Design systems, DX tooling, cloud-native front-ends</p>
          </article>
        </div>
      </div>
    </section>
  )
}

export default AboutSection
