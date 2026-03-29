import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useSearchHighlight } from '../features/vscode/state/useSearchHighlight'
import { highlightText } from '../features/vscode/utils/highlight'
import { experiences } from './content'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export const ExperienceSection = () => {
  const { query } = useSearchHighlight()
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={containerVariants}
      className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-[2.5rem] border border-outline-variant bg-surface-container-low p-6 text-on-surface shadow-2xl @md:p-14"
    >
      {/* Decorative Gradient */}
      <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-primary/5 blur-[100px]" />

      <motion.header variants={itemVariants} className="mb-8 space-y-3 @md:mb-12 @md:space-y-4">
        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 @md:text-xs">
          <span className="h-px w-6 bg-primary/20 @md:w-8" />
          Professional Orbit
        </p>
        <h2 className="text-3xl font-black tracking-tight @sm:text-4xl @md:text-5xl">Strategic Partnerships</h2>
        <p className="max-w-2xl text-base text-on-surface-variant/70 @md:text-lg">
          Collaborating with high-growth product teams to architect resilient and performant digital ecosystems.
        </p>
      </motion.header>

      <div className="relative">
        {/* Timeline Axis */}
        <span className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-outline-variant/30 to-transparent @md:left-[15px]" />
        
        <div className="space-y-8 @md:space-y-12">
          {experiences.map((entry) => (
            <motion.article 
              key={entry.company} 
              variants={itemVariants}
              className="group relative pl-8 @md:pl-14"
            >
              {/* Timeline Node */}
              <div className="absolute left-0 top-1.5 flex h-[24px] w-[24px] items-center justify-center @md:h-[32px] @md:w-[32px]">
                <div className="absolute inset-0 rounded-full bg-accent/20 blur-sm scale-150 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10 transition-colors group-hover:bg-accent @md:h-2.5 @md:w-2.5" />
              </div>

              <div className="flex flex-col gap-1 @md:flex-row @md:items-baseline @md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight text-on-surface @md:text-2xl">
                    {highlightText(entry.title, query)}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80 group-hover:text-accent transition-colors @md:text-xs">
                    {highlightText(entry.company, query)}
                  </p>
                </div>
                <time className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 @md:text-xs">
                  {entry.period}
                </time>
              </div>

              <ul className="mt-4 space-y-3 @md:mt-6 @md:space-y-4">
                {entry.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-xs leading-relaxed text-on-surface-variant/80 transition-colors group-hover:text-on-surface @md:text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/30 group-hover:bg-accent/40 transition-colors" />
                    {highlightText(bullet, query)}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

export default ExperienceSection
