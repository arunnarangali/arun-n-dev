import { useMemo, useState } from 'react'
import type { PortfolioFile } from '../data/files'
import { Icon } from './Icon'
import { useSettings } from '../state/useSettings'

type ExplorerProps = {
  files: PortfolioFile[]
  openFiles: PortfolioFile[]
  activeId: string
  onSelect: (id: string) => void
  variant?: 'sidebar' | 'overlay'
  onClose?: () => void
}

const formatLabel = (file: PortfolioFile) => file.path.slice(1).join('/')

type TreeNode = {
  name: string
  pathKey: string
  children?: TreeNode[]
  file?: PortfolioFile
}

const buildTree = (files: PortfolioFile[]): TreeNode => {
  const root: TreeNode = { name: 'portfolio', pathKey: 'portfolio', children: [] }
  files.forEach((file) => {
    let current = root
    const segments = file.path.slice(1)
    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1
      const pathKey = `${current.pathKey}/${segment}`
      if (isFile) {
        current.children?.push({ name: segment, pathKey, file })
      } else {
        if (!current.children) current.children = []
        let next = current.children.find((child) => !child.file && child.name === segment)
        if (!next) {
          next = { name: segment, pathKey, children: [] }
          current.children.push(next)
        }
        current = next
      }
    })
  })
  return root
}

export const Explorer = ({ files, openFiles, activeId, onSelect, variant = 'sidebar', onClose }: ExplorerProps) => {
  const { layout } = useSettings()
  const isCompact = layout === 'compact'

  const wrapperClass =
    variant === 'overlay'
      ? 'flex h-full w-full flex-col bg-surface-container-low font-sans text-[11px] tracking-tight'
      : 'flex w-full flex-col bg-surface-container-low font-sans text-[11px] tracking-tight'

  const tree = useMemo(() => buildTree(files), [files])
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'portfolio/src': true,
    'portfolio/src/pages': true,
    'portfolio/src/data': false,
  })

  const toggleFolder = (pathKey: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [pathKey]: !(prev[pathKey] ?? true),
    }))
  }

  const renderNodes = (nodes: TreeNode[] = [], depth = 0) =>
    nodes.map((node) => {
      if (node.file) {
        const file = node.file
        const isActive = file.id === activeId
        return (
          <button
            key={file.id}
            onClick={() => {
              onSelect(file.id)
              if (variant === 'overlay') onClose?.()
            }}
            className={[
              'flex w-full items-center justify-between text-left transition-colors',
              isCompact ? 'h-[22px]' : 'h-[24px]',
              isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant/80 hover:bg-surface-container-high hover:text-accent',
            ].join(' ')}
            style={{ paddingLeft: `${depth * 8 + 20}px` }}
          >
            <span className="flex items-center gap-2">
              <Icon name={file.icon} className="text-[14px] text-primary" />
              <span className="lowercase">{file.name}</span>
            </span>
          </button>
        )
      }
      const isExpanded = expandedFolders[node.pathKey] ?? true
      return (
        <div key={node.pathKey}>
          <button
            onClick={() => toggleFolder(node.pathKey)}
            className="flex h-[24px] w-full items-center gap-1.5 text-left text-on-surface-variant/80 transition hover:bg-surface-container-high hover:text-accent"
            style={{ paddingLeft: `${depth * 8 + 8}px` }}
          >
            <Icon name={isExpanded ? 'expand_more' : 'chevron_right'} className="text-[14px]" />
            <span className="lowercase">{node.name}</span>
          </button>
          {isExpanded && renderNodes(node.children, depth + 1)}
        </div>
      )
    })

  return (
    <aside className={[wrapperClass, isCompact ? 'text-[10px]' : 'text-[11px]'].join(' ')}>
      <div className="flex h-9 items-center justify-between px-4 text-on-surface-variant">
        <span className="font-bold uppercase tracking-widest text-[10px]">Explorer</span>
        <Icon name="more_horiz" className="text-[14px]" />
      </div>

      <div>
        <div className="flex h-6 items-center bg-surface-container-high/40 px-2 text-on-surface-variant">
          <Icon name="expand_more" className="mr-1 text-[14px]" />
          <span className="font-bold uppercase tracking-widest text-[9px]">Open Editors</span>
        </div>
        <div className="vscode-scrollbar max-h-[78px] overflow-x-hidden overflow-y-auto pr-2">
          {openFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => {
                onSelect(file.id)
                if (variant === 'overlay') onClose?.()
              }}
              className={[
                'flex w-full items-center gap-2 px-6 text-left text-on-surface hover:bg-surface-container-high/60 hover:text-accent',
                isCompact ? 'h-5' : 'h-6',
              ].join(' ')}
            >
              <Icon name={file.icon} className="text-[14px] text-primary" />
              <span className="lowercase">{formatLabel(file)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-col">{renderNodes(tree.children)}</div>
    </aside>
  )
}
