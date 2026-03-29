import { motion, type Variants } from 'framer-motion'
import { aboutContent } from '../../content'

type PhilosophyCardProps = {
  variants: Variants
}

export const PhilosophyCard = ({ variants }: PhilosophyCardProps) => {
  return (
    <motion.div variants={variants} className="relative flex flex-col justify-center space-y-10 text-on-surface-variant">
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/40 @6xl:text-sm">Philosophy</h3>
        <p className="text-xl font-medium leading-relaxed text-on-surface @6xl:text-2xl">
          {aboutContent.bio}
        </p>
      </div>

      <div className="grid gap-6 @6xl:grid-cols-2">
        <motion.article
          whileHover={{ y: -5 }}
          className="group rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/40 p-6 transition-colors hover:border-accent/30"
        >
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.3em] text-primary/60 group-hover:text-accent transition-colors @6xl:text-[10px]">Systems Engineering</p>
          <p className="text-sm leading-relaxed text-on-surface-variant group-hover:text-on-surface transition-colors">
            Scalable design systems, performance orchestration, and elite DX patterns.
          </p>
        </motion.article>
        <motion.article
          whileHover={{ y: -5 }}
          className="group rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/40 p-6 transition-colors hover:border-primary/30"
        >
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.3em] text-secondary/60 group-hover:text-primary transition-colors @6xl:text-[10px]">Strategic Delivery</p>
          <p className="text-sm leading-relaxed text-on-surface-variant group-hover:text-on-surface transition-colors">
            Fractional leadership, architecture audits, and rapid enterprise prototyping.
          </p>
        </motion.article>
      </div>
    </motion.div>
  )
}
