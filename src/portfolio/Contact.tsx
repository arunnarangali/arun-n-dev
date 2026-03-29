import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ContactFormCard } from './components/contact/ContactFormCard'
import { DirectChannelsCard } from './components/contact/DirectChannelsCard'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

export const ContactSection = () => {
  return (
    <motion.section
      id="contact"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={containerVariants}
      className="mx-auto grid w-full max-w-7xl gap-8 rounded-[2.5rem] border border-outline-variant bg-surface-container-low p-8 text-on-surface shadow-2xl @container @6xl:grid-cols-2 @5xl:p-14"
    >
      <ContactFormCard variants={itemVariants} />
      <DirectChannelsCard variants={itemVariants} />
    </motion.section>
  )
}

export default ContactSection
