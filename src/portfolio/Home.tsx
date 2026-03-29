import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { HeroCard } from './components/home/HeroCard'
import { CodeWindowCard } from './components/home/CodeWindowCard'
import { DashboardCard } from './components/home/DashboardCard'
import { ShipmentsCard } from './components/home/ShipmentsCard'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] },
  },
}

export const HomeSection = () => {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative mx-auto w-full max-w-7xl @container"
    >
      {/* ROW 1: Hero + Code Window */}
      <div className="grid grid-cols-1 gap-6 @7xl:grid-cols-[70fr,30fr]">
        <HeroCard variants={itemVariants} />
        <CodeWindowCard variants={itemVariants} />
      </div>

      {/* ROW 2: Dashboard + Shipments — full width */}
      <div className="mt-6 grid grid-cols-1 gap-6 @7xl:grid-cols-2">
        <DashboardCard variants={itemVariants} />
        <ShipmentsCard variants={itemVariants} />
      </div>
    </motion.section>
  )
}

export default HomeSection
