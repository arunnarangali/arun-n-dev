type HighlightTextProps = {
  text: string
}

export const highlightText = ({ text }: HighlightTextProps) => {
  const parts = text.split(/(Arun|N|React|Fast|Accessible)/g)
  return parts.map((part, i) => (
    <span key={`${part}-${i}`} className={['Arun', 'N', 'React'].includes(part) ? 'text-primary' : undefined}>
      {part}
    </span>
  ))
}
