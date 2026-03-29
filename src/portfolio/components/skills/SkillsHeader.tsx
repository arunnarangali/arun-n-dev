import { motion, type Variants } from 'framer-motion'

type SkillsHeaderProps = {
  variants: Variants
}

export const SkillsHeader = ({ variants }: SkillsHeaderProps) => {
  return (
    <motion.header variants={variants} className="space-y-3 @3xl:space-y-4">
      <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 @3xl:text-xs">
        <span className="h-px w-6 bg-primary/20 @3xl:w-8" />
        Technical Stack
      </p>
      <h2 className="text-3xl font-black tracking-tight @3xl:text-4xl @5xl:text-5xl">Systems Thinking & Pragmatic Delivery</h2>
      <p className="max-w-2xl text-base text-on-surface-variant/70 @3xl:text-lg">
        A curated architectural toolkit optimized for building resilient, mission-critical frontend ecosystems.
      </p>
    </motion.header>
  )
}
