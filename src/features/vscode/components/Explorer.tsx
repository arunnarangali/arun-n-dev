import { useMemo, useState } from 'react'
import type { PortfolioFile } from '../data/files'
import { Icon } from './Icon'

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
  const wrapperClass =
    variant === 'overlay'
      ? 'flex h-full w-full flex-col bg-[#1B1B1C] font-mono text-[11px] uppercase tracking-wider'
      : 'flex w-60 flex-col bg-[#1B1B1C] font-mono text-[11px] uppercase tracking-wider'

  const tree = useMemo(() => buildTree(files), [files])
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'portfolio/src': true,
    'portfolio/src/pages': true,
    'portfolio/src/data': true,
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
              'flex items-center justify-between py-1 text-left transition-colors',
              isActive ? 'border-l-2 border-primary bg-[#2A2A2A] text-on-surface' : 'text-secondary/70 hover:bg-[#2A2A2A] hover:text-on-surface',
            ].join(' ')}
            style={{ paddingLeft: `${depth * 16 + 24}px` }}
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
            className="flex w-full items-center gap-2 px-4 py-1 text-left text-secondary/80 transition hover:text-on-surface"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            <Icon name={isExpanded ? 'expand_more' : 'chevron_right'} className="text-[14px]" />
            <span className="lowercase">{node.name}</span>
          </button>
          {isExpanded && renderNodes(node.children, depth + 1)}
        </div>
      )
    })

  return (
    <aside className={wrapperClass}>
      <div className="flex items-center justify-between px-4 py-3 text-on-surface-variant">
        <span className="font-bold">Explorer: portfolio</span>
        {variant === 'overlay' ? (
          <button onClick={onClose} className="rounded p-1 text-secondary hover:bg-[#2A2A2A]">
            <Icon name="close" className="text-[16px]" />
          </button>
        ) : (
          <Icon name="more_horiz" className="text-[14px]" />
        )}
      </div>

      <div>
        <div className="flex items-center bg-[#2A2A2A] px-2 py-1 text-on-surface">
          <Icon name="expand_more" className="mr-1 text-[14px]" />
          <span className="font-bold">Open Editors</span>
        </div>
        {openFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => {
              onSelect(file.id)
              onClose?.()
            }}
            className="flex w-full items-center gap-2 px-6 py-1 text-left text-[#E5E2E1] hover:bg-[#2A2A2A]"
          >
            <Icon name={file.icon} className="text-[14px] text-primary" />
            <span className="lowercase">{formatLabel(file)}</span>
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-col">{renderNodes(tree.children)}</div>

      <div className="mt-auto p-4">
        <button className="w-full rounded bg-[#007ACC] py-2 text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-[#005A9E]">
          GET IN TOUCH
        </button>
      </div>
    </aside>
  )
}
