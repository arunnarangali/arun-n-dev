import { motion, type Variants } from 'framer-motion'
import { highlightText } from '../../../features/vscode/utils/highlight'
import { useSettings } from '../../../features/vscode/state/useSettings'
import { SkillChip } from '../SkillChip'

type SkillGroup = {
  label: string
  items: string[]
}

type SkillGroupCardProps = {
  group: SkillGroup
  query: string
  variants: Variants
}

export const SkillGroupCard = ({ group, query, variants }: SkillGroupCardProps) => {
  const { theme } = useSettings()
  const isLight = theme === 'light'
  return (
    <motion.article
      key={group.label}
      variants={variants}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-outline-variant/30 bg-surface-container-lowest/40 p-6 transition-colors hover:border-accent/30 @5xl:p-8"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-accent/10" />

      <div className="relative space-y-5 @3xl:space-y-6">
        <div className="flex flex-col gap-1 @sm:flex-row @sm:items-center @sm:justify-between">
          <h3
            className={[
              'text-sm font-black uppercase tracking-[0.2em] transition-colors',
              isLight ? 'text-on-surface group-hover:text-primary' : 'text-on-surface/40 group-hover:text-primary/60',
            ].join(' ')}
          >
            {highlightText(group.label, query)}
          </h3>
          <span className="text-[10px] font-black text-on-surface-variant/30">{group.items.length} units</span>
        </div>
        <div className="flex flex-wrap gap-2 text-on-surface-variant">
          {group.items.map((item) => (
            <span
              key={item}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-high/30 px-3 py-1.5 text-xs font-medium text-primary/90 transition-all hover:bg-accent/10 hover:text-accent"
            >
              <SkillChip label={item} />
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  )
}
