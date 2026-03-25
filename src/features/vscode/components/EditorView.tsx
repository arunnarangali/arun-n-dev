import type { PortfolioFile } from '../data/files'
import { JsonView } from './JsonView'

type EditorViewProps = {
  file?: PortfolioFile
}

export const EditorView = ({ file }: EditorViewProps) => {
  return (
    <div className="flex-1 overflow-auto bg-[#131313] p-6">
      {file ? (
        <JsonView content={file.content} />
      ) : (
        <div className="flex h-full items-center justify-center font-mono text-on-surface-variant">
          Select a file from the explorer to view its JSON.
        </div>
      )}
    </div>
  )
}
