export type CommandItem = {
  id: string
  icon: string
  label: string
  shortcut?: string
}

export const commandItems: CommandItem[] = [
  { id: 'find-in-files', icon: 'search', label: 'Search: Find in Files', shortcut: 'Cmd/Ctrl+Shift+Alt+F' },
  { id: 'open-theme', icon: 'palette', label: 'Preferences: Open Theme', shortcut: 'Cmd/Ctrl+Shift+Alt+T' },
  { id: 'focus-terminal', icon: 'terminal', label: 'Terminal: Focus Terminal', shortcut: 'Ctrl+`' },
  { id: 'toggle-sidebar', icon: 'view_sidebar', label: 'View: Toggle Sidebar', shortcut: 'Cmd/Ctrl+Shift+Alt+B' },
  { id: 'format-document', icon: 'code', label: 'Format Document', shortcut: 'Cmd/Ctrl+Shift+Alt+L' },
]
