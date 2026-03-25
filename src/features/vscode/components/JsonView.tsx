import { useMemo } from 'react'
import { getHintForProperty } from '../data/tooltips'
import { Icon } from './Icon'

type JsonViewProps = {
  content: Record<string, unknown>
}

const classifyValue = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('"')) return 'syntax-string'
  if (['{', '}', '[', ']'].some((char) => trimmed.startsWith(char))) return 'syntax-bracket'
  return 'syntax-punct'
}

const JsonKey = ({ name }: { name: string }) => (
  <span className="relative inline-flex items-center group/key">
    <span className="syntax-key">"{name}"</span>
    <div className="pointer-events-none absolute -top-14 left-0 z-10 w-64 rounded border border-outline-variant bg-surface-container-highest p-2 text-[11px] text-on-surface-variant opacity-0 shadow-2xl transition-opacity group-hover/key:opacity-100">
      <div className="mb-1 flex items-center gap-2 text-primary">
        <Icon name="info" className="text-[14px]" />
        <span className="font-semibold text-on-surface">Property: {name}</span>
      </div>
      <p>{getHintForProperty(name)}</p>
    </div>
  </span>
)

const renderValue = (value: string) => {
  if (!value) return null
  const leadingSpaces = value.length - value.trimStart().length
  const spacing = leadingSpaces > 0 ? value.slice(0, leadingSpaces) : ''
  const core = value.slice(leadingSpaces)
  const className = classifyValue(core)
  return (
    <>
      {spacing}
      <span className={className}>{core}</span>
    </>
  )
}

const renderLine = (line: string, index: number) => {
  const keyMatch = line.match(/^(\s*)"([^"']+)"(:\s*)(.*)$/)
  return (
    <div key={`${line}-${index}`} className="editor-line whitespace-pre text-[13px] leading-relaxed">
      {keyMatch ? (
        <>
          {keyMatch[1]}
          <JsonKey name={keyMatch[2]} />
          <span className="syntax-punct">{keyMatch[3]}</span>
          {renderValue(keyMatch[4])}
        </>
      ) : (
        <span className={classifyValue(line)}>{line}</span>
      )}
    </div>
  )
}

type CodeRow = { type: 'code'; text: string; lineNumber: number }
type PreviewRow = { type: 'preview'; src: string; indent: number }
type CaretRow = { type: 'caret' }
type Row = CodeRow | PreviewRow | CaretRow

const createRows = (formatted: string): Row[] => {
  const lines = formatted.split('\n')
  const rows: Row[] = []
  let lineNumber = 1

  lines.forEach((line) => {
    rows.push({ type: 'code', text: line, lineNumber })
    lineNumber += 1

    const imageMatch = line.match(/^(\s*)"image"\s*:\s*"([^"]+)"/)
    if (imageMatch) {
      rows.push({ type: 'preview', src: imageMatch[2], indent: imageMatch[1]?.length ?? 0 })
    }
  })

  rows.push({ type: 'caret' })
  return rows
}

export const JsonView = ({ content }: JsonViewProps) => {
  const formatted = useMemo(() => JSON.stringify(content, null, 2), [content])
  const rows = useMemo(() => createRows(formatted), [formatted])

  return (
    <div className="flex">
      <div className="select-none pr-4 text-right font-mono text-[11px] text-on-surface-variant/40">
        {rows.map((row, index) => (
          <div key={`gutter-${index}`}>{row.type === 'code' ? row.lineNumber : ' '}</div>
        ))}
      </div>
      <div className="flex-1 space-y-2 font-mono text-on-surface">
        {rows.map((row, index) => {
          if (row.type === 'code') {
            return <div key={`line-${index}`} className="whitespace-pre text-[13px] leading-relaxed">{renderLine(row.text, index)}</div>
          }
          if (row.type === 'preview') {
            return (
              <div
                key={`preview-${index}`}
                className="overflow-hidden rounded border border-outline-variant bg-surface-container-low"
                style={{ marginLeft: `${row.indent}ch` }}
              >
                <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 text-[10px] text-on-surface-variant/60">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-on-surface-variant/30" />
                    <span className="h-2 w-2 rounded-full bg-on-surface-variant/30" />
                    <span className="h-2 w-2 rounded-full bg-on-surface-variant/30" />
                  </div>
                  <span>preview: {row.src.split('/').pop()}</span>
                </div>
                <div className="bg-[#050505]">
                  <img
                    src={row.src}
                    alt={row.src}
                    className="h-64 w-full object-cover grayscale transition duration-700 hover:grayscale-0"
                  />
                </div>
              </div>
            )
          }
          return (
            <div key={`caret-${index}`} className="editor-line whitespace-pre">
              <span className="editor-caret inline-block h-4 align-middle" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
