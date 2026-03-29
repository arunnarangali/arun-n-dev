import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { PortfolioFile } from '../data/files'
import { useSettings } from '../state/useSettings'

export type SinglePageEditorHandle = {
  scrollToSection: (id: string) => void
}

type SinglePageEditorProps = {
  files: PortfolioFile[]
  onActiveSection: (id: string) => void
}

export const SinglePageEditor = forwardRef<SinglePageEditorHandle, SinglePageEditorProps>(
  ({ files, onActiveSection }, ref) => {
    const { layout } = useSettings()
    const containerRef = useRef<HTMLDivElement>(null)
    const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
    const lastActiveId = useRef<string | null>(null)
    const isProgrammaticScroll = useRef(false)

    const registerSection = (id: string) => (element: HTMLElement | null) => {
      if (element) {
        sectionRefs.current.set(id, element)
      } else {
        sectionRefs.current.delete(id)
      }
    }

    useImperativeHandle(ref, () => ({
      scrollToSection: (id: string) => {
        const target = sectionRefs.current.get(id)
        if (!target) return
        isProgrammaticScroll.current = true
        lastActiveId.current = id
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.setTimeout(() => {
          isProgrammaticScroll.current = false
        }, 400)
      },
    }))

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (isProgrammaticScroll.current) return
          const visible = entries.filter((entry) => entry.isIntersecting)
          if (visible.length === 0) return
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          const target = visible[0]?.target as HTMLElement | undefined
          const id = target?.dataset.fileId
          if (!id || id === lastActiveId.current) return
          lastActiveId.current = id
          onActiveSection(id)
        },
        { root: container, threshold: [0.25, 0.5, 0.75] },
      )

      sectionRefs.current.forEach((element) => observer.observe(element))
      return () => observer.disconnect()
    }, [files, onActiveSection])

    return (
      <div
        ref={containerRef}
        className={[
          'vscode-scrollbar @container h-full w-full min-w-0 overflow-x-hidden overflow-y-auto bg-surface',
          layout === 'compact' ? 'p-4 @md:p-5' : 'p-6 @md:p-8',
        ].join(' ')}
      >
        <div className="space-y-10">
          {files.map((file) => (
            <section
              key={file.id}
              data-file-id={file.id}
              ref={registerSection(file.id)}
              className="scroll-mt-16"
            >
              {'preview' in file && file.preview ? <file.preview /> : null}
            </section>
          ))}
        </div>
      </div>
    )
  },
)

SinglePageEditor.displayName = 'SinglePageEditor'
