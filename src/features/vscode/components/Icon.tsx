type IconProps = {
  name: string
  className?: string
}

export const Icon = ({ name, className = '' }: IconProps) => (
  <span className={['material-symbols-outlined', className].filter(Boolean).join(' ')}>{name}</span>
)
