import { motion, type Variants } from 'framer-motion'
import { heroContent } from '../../content'
import { highlightText } from './highlightText'

type HeroCardProps = {
  variants: Variants
}

export const HeroCard = ({ variants }: HeroCardProps) => {
  return (
    <motion.div
      variants={variants}
      className="flex flex-col justify-center space-y-8 rounded-[2.5rem] border border-outline-variant bg-surface-container-low p-6 shadow-2xl @sm:p-8 @5xl:p-14"
    >
      <div className="space-y-4 @3xl:space-y-6">
        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
          <span className="h-px w-8 bg-primary/20" />
          Systems Architect
        </p>
        <h1 className="text-3xl font-black leading-[1.1] tracking-tighter @3xl:text-4xl @5xl:text-5xl @6xl:text-6xl">
          {highlightText({ text: heroContent.title })}
        </h1>
        <p className="max-w-xl text-lg font-medium leading-relaxed text-on-surface-variant/80 @3xl:text-xl">
          Frontend developer building fast, accessible <span className="text-primary font-bold">React</span> experiences.
        </p>
      </div>

      <div className="flex max-w-md gap-3 @sm:gap-4">
        {heroContent.ctas.map((cta) => (
          <a
            key={cta.label}
            href={cta.href}
            className={[
              'flex-1 inline-flex items-center justify-center rounded-xl border px-4 py-3 text-xs font-black tracking-wide transition-all shadow-lg whitespace-nowrap @sm:px-6 @3xl:px-8 @3xl:py-3.5 @3xl:text-sm',
              cta.variant === 'ghost'
                ? 'border-outline-variant bg-surface-container-highest/20 text-on-surface-variant hover:bg-surface-container-highest/50'
                : 'border-primary/20 bg-primary text-on-primary hover:bg-accent hover:text-on-accent hover:shadow-accent/20',
            ].join(' ')}
          >
            {cta.label}
          </a>
        ))}
      </div>
    </motion.div>
  )
}
