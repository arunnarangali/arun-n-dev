import { useMemo } from 'react'
import { Highlight, themes, type Language, type RenderProps } from 'prism-react-renderer'
import type { PortfolioFile } from '../data/files'
import { JsonView } from './JsonView'
import { MarkdownView } from './MarkdownView'
import { useSettings } from '../state/useSettings'

type EditorViewProps = {
  file?: PortfolioFile
  mode: 'preview' | 'code'
}

export const EditorView = ({ file, mode }: EditorViewProps) => {
  const { layout } = useSettings()
  const isReadmeMarkdown = file?.kind === 'markdown' && file?.id === 'portfolio/README.md'
  return (
    <div className={[
      'vscode-scrollbar h-full w-full min-w-0 overflow-x-hidden overflow-y-auto bg-surface',
      layout === 'compact' ? 'p-4' : 'p-6',
    ].join(' ')}>
      {!file && (
        <div className="flex h-full items-center justify-center font-mono text-on-surface-variant">
          Select a file from the explorer to begin.
        </div>
      )}
      {file?.kind === 'json' && <JsonView source={file.source} />}
      {file?.kind === 'markdown' && (isReadmeMarkdown && mode === 'code' ? (
        <CodeBlock code={file.source} language="markdown" />
      ) : (
        <MarkdownView source={file.source} />
      ))}
      {file?.kind === 'tsx' && file.preview && (
        <div className="h-full w-full min-w-0">
          {mode === 'preview' ? <file.preview /> : <CodeBlock code={file.source} language={file.language} />}
        </div>
      )}
    </div>
  )
}

type CodeBlockProps = {
  code: string
  language?: Language
}

const CodeBlock = ({ code, language = 'tsx' }: CodeBlockProps) => {
  const trimmed = useMemo(() => code.trim(), [code])
  const { theme } = useSettings()
  const prismTheme = theme === 'light' ? themes.vsLight : themes.vsDark
  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
      <Highlight code={trimmed} language={language} theme={prismTheme}>
        {({ className, style, tokens, getLineProps, getTokenProps }: RenderProps) => (
          <pre
            className={`${className} vscode-scrollbar max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl text-sm`}
            style={{ ...style, background: 'transparent', padding: '1.5rem' }}
          >
            {tokens.map((line, i) => (
              <div key={`line-${i}`} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}
