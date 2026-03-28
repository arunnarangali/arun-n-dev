import { useMemo } from 'react'
import { getHintForProperty } from '../data/tooltips'
import { Icon } from './Icon'

type JsonViewProps = {
  source: string
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

const renderLine = (line: string) => {
  const keyMatch = line.match(/^(\s*)"([^"']+)"(:\s*)(.*)$/)
  if (keyMatch) {
    return (
      <span className="editor-line whitespace-pre text-[13px] leading-relaxed">
        {keyMatch[1]}
        <JsonKey name={keyMatch[2]} />
        <span className="syntax-punct">{keyMatch[3]}</span>
        {renderValue(keyMatch[4])}
      </span>
    )
  }
  return <span className={`editor-line whitespace-pre text-[13px] leading-relaxed ${classifyValue(line)}`}>{line}</span>
}

export const JsonView = ({ source }: JsonViewProps) => {
  const formatted = useMemo(() => {
    try {
      const parsed = JSON.parse(source)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return source
    }
  }, [source])

  const lines = useMemo(() => formatted.split('\n'), [formatted])

  return (
    <div className="flex">
      <div className="select-none pr-4 text-right font-mono text-[11px] text-on-surface-variant/40">
        {lines.map((_, index) => (
          <div key={`gutter-${index}`}>{index + 1}</div>
        ))}
        <div>&nbsp;</div>
      </div>
      <div className="flex-1 font-mono text-on-surface">
        {lines.map((line, index) => (
          <div key={`line-${index}`} className="whitespace-pre text-[13px] leading-relaxed">
            {renderLine(line)}
          </div>
        ))}
        <div className="editor-line whitespace-pre">
          <span className="editor-caret inline-block h-4 align-middle" />
        </div>
      </div>
    </div>
  )
}
