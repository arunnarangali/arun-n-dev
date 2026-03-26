import { marked } from 'marked'
import { useMemo } from 'react'

type MarkdownViewProps = {
  source: string
}

marked.setOptions({ breaks: true })

export const MarkdownView = ({ source }: MarkdownViewProps) => {
  const rendered = useMemo(() => marked.parse(source), [source])

  return (
    <div className="space-y-6">
      <div className="rounded border border-outline-variant bg-surface-container">
        <header className="border-b border-outline-variant/40 px-4 py-2 text-[11px] uppercase tracking-widest text-on-surface-variant">
          Markdown Source
        </header>
        <pre
          className="max-h-[24rem] overflow-auto whitespace-pre-wrap break-words px-4 py-4 font-mono text-[13px] text-on-surface-variant"
          style={{ overflowWrap: 'anywhere' }}
        >
          {source.trim()}
        </pre>
      </div>
      <div className="rounded border border-outline-variant bg-surface-container">
        <header className="border-b border-outline-variant/40 px-4 py-2 text-[11px] uppercase tracking-widest text-on-surface-variant">
          Rendered Preview
        </header>
        <div className="markdown-preview space-y-4 px-6 py-4 text-sm text-on-surface" dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
    </div>
  )
}
