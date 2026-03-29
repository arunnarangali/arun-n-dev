import { motion, type Variants } from 'framer-motion'
import { useSettings } from '../../../features/vscode/state/useSettings'

type ContactFormCardProps = {
  variants: Variants
}

export const ContactFormCard = ({ variants }: ContactFormCardProps) => {
  const { theme } = useSettings()
  const isLight = theme === 'light'
  return (
    <motion.div variants={variants} className="group space-y-8">
      <motion.header variants={variants} className="space-y-4">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.4em] text-primary/60">
          <span className="h-px w-8 bg-primary/20" />
          Communication Layer
        </p>
        <h2
          className={[
            'text-2xl font-black tracking-tight @xs:text-3xl @sm:text-4xl @5xl:text-5xl transition-colors',
            isLight ? 'text-on-surface group-hover:text-primary' : 'text-on-surface',
          ].join(' ')}
        >
          Architect your next move
        </h2>
        <p className="max-w-md text-lg text-on-surface-variant/70">
          Strategic collaborations begin with a clear roadmap. Briefly outline your mission below.
        </p>
      </motion.header>

      <motion.form variants={variants} className="space-y-5">
        <div className="group space-y-1.5">
          <label
            className={[
              'text-[10px] font-black uppercase tracking-[0.3em] transition-colors',
              isLight ? 'text-on-surface/70 group-focus-within:text-primary/80' : 'text-on-surface/40 group-focus-within:text-accent/60',
            ].join(' ')}
          >
            Full name
          </label>
          <input
            className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/50 p-4 text-sm text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
            placeholder="Jane Architect"
          />
        </div>
        <div className="group space-y-1.5">
          <label
            className={[
              'text-[10px] font-black uppercase tracking-[0.3em] transition-colors',
              isLight ? 'text-on-surface/70 group-focus-within:text-primary/80' : 'text-on-surface/40 group-focus-within:text-accent/60',
            ].join(' ')}
          >
            Secure email
          </label>
          <input
            className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/50 p-4 text-sm text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
            placeholder="you@ecosystem.com"
          />
        </div>
        <div className="group space-y-1.5">
          <label
            className={[
              'text-[10px] font-black uppercase tracking-[0.3em] transition-colors',
              isLight ? 'text-on-surface/70 group-focus-within:text-primary/80' : 'text-on-surface/40 group-focus-within:text-accent/60',
            ].join(' ')}
          >
            Mission overview
          </label>
          <textarea
            className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/50 p-4 text-sm text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
            rows={4}
            placeholder="Current challenges, technical debt, strategic goals..."
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-on-primary shadow-lg shadow-primary/10 transition-all hover:bg-accent hover:text-on-accent hover:shadow-accent/20"
        >
          Initiate Protocol
        </motion.button>
      </motion.form>
    </motion.div>
  )
}
