import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ProfileCard } from './components/about/ProfileCard'
import { PhilosophyCard } from './components/about/PhilosophyCard'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export const AboutSection = () => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={containerVariants}
      className="relative mx-auto grid w-full max-w-7xl gap-8 overflow-hidden rounded-[2.5rem] border border-outline-variant bg-surface-container-low p-6 text-on-surface shadow-2xl @container @6xl:grid-cols-[320px,1fr] @6xl:gap-12 @6xl:p-14"
    >
      {/* Visual Decor */}
      <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" />
      <ProfileCard variants={itemVariants} />
      <PhilosophyCard variants={itemVariants} />
    </motion.section>
  )
}

export default AboutSection
