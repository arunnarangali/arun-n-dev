import { motion, type Variants } from 'framer-motion'
import { projects } from '../../content'

type ShipmentsCardProps = {
  variants: Variants
}

export const ShipmentsCard = ({ variants }: ShipmentsCardProps) => {
  return (
    <motion.div
      variants={variants}
      className="flex flex-col space-y-5 rounded-[2.5rem] border border-outline-variant bg-surface-container-low p-5 shadow-xl @sm:p-6 @3xl:space-y-6 @5xl:p-8"
    >
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-on-surface/40">Selected Shipments</h3>
        <a href="#projects" className="text-[10px] font-bold text-primary hover:text-accent transition-colors">View all</a>
      </div>
      <div className="grid grid-cols-2 gap-3 @3xl:gap-4">
        {projects.slice(0, 4).map((project) => (
          <div key={project.title} className="group flex flex-col justify-between space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/40 p-4 transition-all hover:border-primary/40 @3xl:p-5">
            <h4 className="line-clamp-2 text-xs font-black leading-tight text-on-surface group-hover:text-primary transition-colors">{project.title}</h4>
            <div className="flex gap-2 text-[10px]">
              <span className="text-primary font-bold transition-colors group-hover:text-accent">Project</span>
              <span className="text-on-surface-variant/40">Description</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
