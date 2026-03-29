import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useSearchHighlight } from '../features/vscode/state/useSearchHighlight'
import { skillGroups } from './content'
import { SkillsHeader } from './components/skills/SkillsHeader'
import { SkillGroupCard } from './components/skills/SkillGroupCard'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export const SkillsSection = () => {
  const { query } = useSearchHighlight()
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={containerVariants}
      className="mx-auto w-full max-w-7xl space-y-8 overflow-hidden rounded-[2.5rem] border border-outline-variant bg-surface-container-low p-5 text-on-surface shadow-2xl @container @sm:p-8 @3xl:space-y-12 @5xl:p-14"
    >
      <SkillsHeader variants={itemVariants} />

      <div className="grid gap-4 @6xl:grid-cols-2 @6xl:gap-6 @7xl:grid-cols-3">
        {skillGroups.map((group) => (
          <SkillGroupCard key={group.label} group={group} query={query} variants={itemVariants} />
        ))}
      </div>
    </motion.section>
  )
}

export default SkillsSection
