import { motion, type Variants } from 'framer-motion'
import { socials } from '../../content'
import { useSettings } from '../../../features/vscode/state/useSettings'

type DirectChannelsCardProps = {
  variants: Variants
}

export const DirectChannelsCard = ({ variants }: DirectChannelsCardProps) => {
  const { theme } = useSettings()
  const isLight = theme === 'light'
  return (
    <motion.div variants={variants} className="group flex flex-col justify-between space-y-8 rounded-[2rem] border border-outline-variant/50 bg-surface-container-lowest/30 p-8 @5xl:p-12">
      <div className="space-y-8">
        <h3
          className={[
            'text-sm font-black uppercase tracking-[0.3em] transition-colors',
            isLight ? 'text-on-surface group-hover:text-primary' : 'text-on-surface/40',
          ].join(' ')}
        >
          Direct Channels
        </h3>
        <ul className="space-y-6">
          {socials.map((link) => (
            <li key={link.label} className="group flex items-center justify-between">
              <div>
                <p
                  className={[
                    'text-[10px] font-black uppercase tracking-[0.3em] transition-colors',
                    isLight ? 'text-on-surface/70 group-hover:text-primary/70' : 'text-on-surface/30 group-hover:text-accent/40',
                  ].join(' ')}
                >
                  {link.label}
                </p>
                <p className="font-medium text-on-surface group-hover:text-primary transition-colors">{link.value}</p>
              </div>
              <motion.a
                href={link.href}
                whileHover={{ scale: 1.2, x: 5 }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/50 text-primary transition-colors hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
              >
                <span className="text-xl">↗</span>
              </motion.a>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/50 p-6 text-sm text-on-surface-variant/80">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <p className="font-bold tracking-tight">System Status: Accepting Strategic Engagements</p>
        </div>
        <div className="space-y-1 text-xs opacity-60">
          <p>Availability: GMT+5:30 • 15–20 hrs/week</p>
          <p>Focus Areas: Architecture audits, rapid MVP engineering, design system orchestration.</p>
        </div>
      </div>
    </motion.div>
  )
}
