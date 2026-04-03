import { motion, type Variants } from 'framer-motion'
import { useSettings } from '../../../features/vscode/state/useSettings'
import { useContactForm } from '../../hooks/useContactForm'

type ContactFormCardProps = {
  variants: Variants
}

export const ContactFormCard = ({ variants }: ContactFormCardProps) => {
  const { theme } = useSettings()
  const isLight = theme === 'light'
  const { register, handleSubmit, errors, isSubmitting, submitStatus } = useContactForm()

  const inputClassName = 'w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/50 p-4 text-sm text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 disabled:opacity-50'
  const labelClassName = [
    'text-[10px] font-black uppercase tracking-[0.3em] transition-colors',
    isLight ? 'text-on-surface/70 group-focus-within:text-primary/80' : 'text-on-surface/40 group-focus-within:text-accent/60',
  ].join(' ')

  const getButtonText = () => {
    if (isSubmitting) return 'Sending...'
    if (submitStatus === 'success') return 'Message Sent!'
    return 'Initiate Protocol'
  }

  return (
    <motion.div variants={variants} className="group min-w-0 space-y-8">
      <motion.header variants={variants} className="min-w-0 space-y-4">
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

      <motion.form variants={variants} className="space-y-5" onSubmit={handleSubmit}>
        <motion.div className="group min-w-0 space-y-1.5">
          <label className={labelClassName}>Full name</label>
          <input
            {...register('name')}
            className={inputClassName}
            placeholder="Jane Architect"
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
        </motion.div>

        <motion.div className="group min-w-0 space-y-1.5">
          <label className={labelClassName}>Secure email</label>
          <input
            {...register('email')}
            className={inputClassName}
            placeholder="you@ecosystem.com"
            type="email"
            disabled={isSubmitting}
          />
          {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
        </motion.div>

        <motion.div className="group min-w-0 space-y-1.5">
          <label className={labelClassName}>Mission overview</label>
          <textarea
            {...register('message')}
            className={inputClassName}
            rows={4}
            placeholder="Current challenges, technical debt, strategic goals..."
            disabled={isSubmitting}
          />
          {errors.message && <p className="text-xs text-error mt-1">{errors.message.message}</p>}
        </motion.div>

        {submitStatus === 'success' && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-accent font-medium"
          >
            Message transmitted successfully. Awaiting response.
          </motion.p>
        )}

        {submitStatus === 'error' && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-error font-medium"
          >
            Transmission failed. Retry or use direct channels below.
          </motion.p>
        )}

        <motion.button
          whileHover={!isSubmitting ? { scale: 1.01 } : {}}
          whileTap={!isSubmitting ? { scale: 0.99 } : {}}
          disabled={isSubmitting || submitStatus === 'success'}
          className="w-full rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-on-primary shadow-lg shadow-primary/10 transition-all hover:bg-accent hover:text-on-accent hover:shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {getButtonText()}
        </motion.button>
      </motion.form>
    </motion.div>
  )
}
