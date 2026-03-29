import { motion } from 'framer-motion'
import { useSearchHighlight } from '../features/vscode/state/useSearchHighlight'
import { ProjectCard } from './components/ProjectCard'
import { projects } from './content'

export const ProjectsSection = () => {
  const { query } = useSearchHighlight()
  return (
    <section id="projects" className="mx-auto w-full max-w-7xl space-y-8 py-6 @container @3xl:space-y-12 @3xl:py-10">
      <motion.header
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="space-y-3 @3xl:space-y-4"
      >
        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 @3xl:text-xs">
          <span className="h-px w-6 bg-primary/20 @3xl:w-8" />
          Selected Infrastructure
        </p>
        <h2 className="text-3xl font-black tracking-tight text-on-surface @3xl:text-4xl @5xl:text-5xl">Mission Critical Shipments</h2>
        <p className="max-w-2xl text-base text-on-surface-variant/70 italic @3xl:text-lg">
          High-availability architecture balancing elite UX, developer experience, and tactical outcomes.
        </p>
      </motion.header>
      
      <div className="grid grid-cols-1 gap-8 @6xl:grid-cols-2 @7xl:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard key={project.title} project={project} query={query} index={index} />
        ))}
      </div>
      <div className="flex justify-end">
        <a
          href="https://github.com/arunnarangali?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest/40 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary/80 transition-colors hover:border-accent/40 hover:text-accent"
        >
          Repositories
          <span className="text-xs transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
        </a>
      </div>
    </section>
  )
}

export default ProjectsSection
