import { motion, type Variants } from 'framer-motion'
import profileImg from '../../../assets/hero.png'
import { aboutContent } from '../../content'

type ProfileCardProps = {
  variants: Variants
}

export const ProfileCard = ({ variants }: ProfileCardProps) => {
  return (
    <motion.div variants={variants} className="relative space-y-6 text-center @6xl:text-left">
      <div className="relative mx-auto h-48 w-48 @6xl:mx-0 @sm:h-56 @sm:w-56">
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl" />
        <div className="relative h-full w-full overflow-hidden rounded-3xl border-2 border-primary/30 bg-surface-container-highest shadow-2xl">
          <img src={profileImg} alt="Arun N" className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight">{aboutContent.name}</h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary @6xl:text-xs">{aboutContent.role}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 @6xl:justify-start">
        {aboutContent.highlights.map((item) => (
          <span
            key={item}
            className="rounded-lg border border-outline-variant/50 bg-surface-container-highest/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-accent/40"
          >
            {item}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
