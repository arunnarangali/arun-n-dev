import { motion } from 'framer-motion'
import { highlightText } from '../../features/vscode/utils/highlight'
import type { ProjectCard as ProjectCardType } from '../content'

type ProjectCardProps = {
  project: ProjectCardType
  query: string
  index: number
}

export const ProjectCard = ({ project, query, index }: ProjectCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-container-low shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] transition-all hover:border-primary/40 hover:shadow-primary/10"
    >
      <div className="relative h-48 w-full overflow-hidden @sm:h-52 @3xl:h-56">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/80 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 text-on-surface @3xl:gap-5 @3xl:p-7">
        <div className="space-y-2 @3xl:space-y-3">
          <h3 className="text-xl font-bold tracking-tight text-on-surface transition-colors group-hover:text-primary @3xl:text-2xl">
            {highlightText(project.title, query)}
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant/80">
            {highlightText(project.summary, query)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary/90 transition-colors group-hover:bg-accent/10 group-hover:text-accent"
            >
              {highlightText(tech, query)}
            </span>
          ))}
        </div>
        <motion.a
          href={project.href}
          whileHover={{ x: 5 }}
          className="mt-auto flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-primary hover:text-accent transition-colors"
        >
          View System Playbook 
          <span className="text-lg">→</span>
        </motion.a>
      </div>
    </motion.article>
  )
}
