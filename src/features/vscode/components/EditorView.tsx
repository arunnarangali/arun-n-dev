import { useMemo } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import type { PortfolioFile } from '../data/files'
import { JsonView } from './JsonView'
import { MarkdownView } from './MarkdownView'

type EditorViewProps = {
  file?: PortfolioFile
  mode: 'preview' | 'code'
}

export const EditorView = ({ file, mode }: EditorViewProps) => {
  return (
    <div className="flex-1 min-w-0 overflow-auto bg-[#131313] p-6">
      {!file && (
        <div className="flex h-full items-center justify-center font-mono text-on-surface-variant">
          Select a file from the explorer to begin.
        </div>
      )}
      {file?.kind === 'json' && <JsonView source={file.source} />}
      {file?.kind === 'markdown' && <MarkdownView source={file.source} />}
      {file?.kind === 'tsx' && file.preview && (
        <div className="space-y-4">
          {mode === 'preview' ? <file.preview /> : <CodeBlock code={file.source} language={file.language} />}
        </div>
      )}
    </div>
  )
}

type CodeBlockProps = {
  code: string
  language?: 'tsx' | 'ts' | 'jsx'
}

const CodeBlock = ({ code, language = 'tsx' }: CodeBlockProps) => {
  const trimmed = useMemo(() => code.trim(), [code])
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-[#0b0b0d] p-4">
      <Highlight code={trimmed} language={language as any} theme={themes.vsDark}>
        {({ className, style, tokens, getLineProps, getTokenProps }: any) => (
          <pre
            className={`${className} max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl text-sm`}
            style={{ ...style, background: 'transparent', padding: '1.5rem' }}
          >
            {tokens.map((line: any, i: number) => (
              <div key={`line-${i}`} {...getLineProps({ line, key: i })}>
                {line.map((token: any, key: number) => (
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
