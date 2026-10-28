export type CommandItem = {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
};

export const commandItems: CommandItem[] = [
  {
    id: "find-in-files",
    icon: "search",
    label: "Search: Find in Files",
    shortcut: "Cmd/Ctrl+Shift+Alt+F",
  },
  {
    id: "open-theme",
    icon: "palette",
    label: "Preferences: Open Theme",
    shortcut: "Cmd/Ctrl+Shift+Alt+T",
  },
  { id: "start-job-fit", icon: "bug_report", label: "Debug: Start Job Fit" },
  {
    id: "chat-open",
    icon: "smart_toy",
    label: "Chat: Open Copilot Chat",
    shortcut: "Ctrl+Alt+I",
  },
  { id: "chat-new", icon: "add_comment", label: "Chat: New Chat" },
  {
    id: "chat-owner-mode",
    icon: "shield_person",
    label: "Chat: Unlock Owner Mode",
  },
  { id: "chat-find-jobs", icon: "work", label: "Chat: Find Matching Jobs" },
  { id: "chat-applications", icon: "task_alt", label: "Chat: Show Applications" },
  {
    id: "focus-terminal",
    icon: "terminal",
    label: "Terminal: Focus Terminal",
    shortcut: "Ctrl+`",
  },
  {
    id: "toggle-sidebar",
    icon: "view_sidebar",
    label: "View: Toggle Sidebar",
    shortcut: "Cmd/Ctrl+Shift+Alt+B",
  },
  {
    id: "format-document",
    icon: "code",
    label: "Format Document",
    shortcut: "Cmd/Ctrl+Shift+Alt+L",
  },
];
