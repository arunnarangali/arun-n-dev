import { motion, type Variants } from 'framer-motion'
import { Icon } from '../../../features/vscode/components/Icon'
import profileImg from '../../../assets/hero.png'
import { aboutContent, allSkills, heroContent } from '../../content'

type DashboardCardProps = {
  variants: Variants
}

export const DashboardCard = ({ variants }: DashboardCardProps) => {
  const previewSkills = allSkills.slice(0, 5)

  return (
    <motion.div
      variants={variants}
      className="grid grid-cols-1 gap-6 overflow-hidden rounded-[2.5rem] border border-outline-variant/60 bg-surface-container-low p-5 shadow-xl @sm:p-6 @6xl:grid-cols-[180px,1fr] @7xl:grid-cols-[240px,1fr]"
    >
      <div className="flex flex-col justify-center gap-3 @3xl:gap-4">
        {heroContent.metrics.slice(0, 3).map((metric) => (
          <div key={metric.label} className="group flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/40 p-4 transition-colors hover:border-accent/40 @3xl:gap-4 @5xl:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest text-primary group-hover:bg-accent group-hover:text-on-accent transition-colors @3xl:h-12 @3xl:w-12">
              {metric.icon && <Icon name={metric.icon} className="text-[20px] @3xl:text-[24px]" />}
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black tracking-tighter text-on-surface @3xl:text-2xl">{metric.value}</p>
              <p className="truncate text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/50">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl bg-surface-container-lowest/40 p-6 text-center border border-outline-variant/20 @3xl:space-y-6 @5xl:p-8">
        <div className="relative h-24 w-24 @3xl:h-28 @3xl:w-28">
          <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl scale-110" />
          <div className="relative h-full w-full overflow-hidden rounded-3xl border border-primary/30 bg-surface-container-lowest shadow-2xl">
            <img src={profileImg} alt={aboutContent.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black tracking-tight @3xl:text-2xl">{aboutContent.name}</h3>
          <div className="flex flex-wrap justify-center gap-1">
            {previewSkills.map((tag) => (
              <span key={tag} className="rounded-md bg-surface-container-highest/60 px-2 py-0.5 text-[9px] font-bold text-on-surface-variant/70 hover:bg-accent/20 hover:text-accent transition-colors">{tag}</span>
            ))}
            <a href="#skills" className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary hover:text-accent hover:bg-accent/10 transition-colors">
              +{allSkills.length - 5} more
              <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
            </a>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-on-surface-variant/70 italic px-2 @3xl:px-4">
          {aboutContent.bio.slice(0, 100)}...
        </p>
      </div>
    </motion.div>
  )
}
