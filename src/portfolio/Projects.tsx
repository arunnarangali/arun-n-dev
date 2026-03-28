import { useSearchHighlight } from '../features/vscode/state/useSearchHighlight'
import { ProjectCard } from './components/ProjectCard'
import { projects } from './content'

export const ProjectsSection = () => {
  const { query } = useSearchHighlight()
  return (
    <section id="projects" className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Projects</p>
        <h2 className="text-3xl font-semibold text-on-surface">Selected Shipments</h2>
        <p className="text-sm text-on-surface-variant">High-impact engagements balancing UX, DX, and measurable outcomes.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} query={query} />
        ))}
      </div>
    </section>
  )
}

export default ProjectsSection
