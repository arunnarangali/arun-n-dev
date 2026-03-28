import MarkdownPreview from '@uiw/react-markdown-preview'
import { useMemo } from 'react'
import { useSettings } from '../state/useSettings'
import '@uiw/react-markdown-preview/markdown.css'

type MarkdownViewProps = {
  source: string
}

export const MarkdownView = ({ source }: MarkdownViewProps) => {
  const { theme, layout } = useSettings()
  const isLight = theme === 'light'
  const previewSource = useMemo(() => source, [source])

  return (
    <div className="space-y-6">
      <div className="rounded border border-outline-variant bg-surface-container">
        <header className="border-b border-outline-variant/40 px-4 py-2 text-[11px] uppercase tracking-widest text-on-surface-variant">
          Rendered Preview
        </header>
        {/* <div className={layout === 'compact' ? 'px-4 py-3' : 'px-6 py-4'} data-color-mode={isLight ? 'light' : 'dark'}> */}
        <MarkdownPreview
          source={previewSource}
          className={`markdown-preview text-sm text-on-surface ${layout === 'compact' ? 'px-4 py-3' : 'px-6 py-4'}`}
          wrapperElement={{ 'data-color-mode': isLight ? 'light' : 'dark' }}
        />
        {/* </div> */}
      </div>
    </div>
  )
}
