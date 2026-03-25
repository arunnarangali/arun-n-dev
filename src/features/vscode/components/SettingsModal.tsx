import { Modal } from './Modal'
import { Icon } from './Icon'
import { useSettings } from '../state/useSettings'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
}

type ThemeOption = {
  id: 'dark' | 'light' | 'highContrast'
  label: string
  icon: string
}

const themes: ThemeOption[] = [
  { id: 'dark', label: 'Dark+', icon: 'dark_mode' },
  { id: 'light', label: 'Light+', icon: 'light_mode' },
  { id: 'highContrast', label: 'High Contrast', icon: 'contrast' },
]

type LayoutOption = {
  id: 'comfortable' | 'compact'
  label: string
  description: string
}

const layouts: LayoutOption[] = [
  { id: 'comfortable', label: 'Comfortable', description: 'Standard spacing and sizing' },
  { id: 'compact', label: 'Compact', description: 'Reduced spacing for more content' },
]

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { theme, setTheme, layout, setLayout } = useSettings()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" icon="settings">
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-secondary/70">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-2 rounded border p-3 transition-all ${
                  theme === t.id
                    ? 'border-emerald-400/60 bg-[#1a3a1a]'
                    : 'border-[#2a2a2a] bg-[#131316] hover:border-emerald-400/40'
                }`}
              >
                <Icon name={t.icon} className="text-xl text-on-surface" />
                <span className="text-[10px] text-on-surface">{t.label}</span>
                {theme === t.id && <Icon name="check" className="text-emerald-400 text-[12px]" />}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-secondary/70">Layout Mode</h3>
          <div className="space-y-2">
            {layouts.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                className={`flex w-full items-center justify-between rounded border p-3 text-left transition-all ${
                  layout === l.id
                    ? 'border-emerald-400/60 bg-[#1a3a1a]'
                    : 'border-[#2a2a2a] bg-[#131316] hover:border-emerald-400/40'
                }`}
              >
                <div>
                  <span className="text-xs text-on-surface">{l.label}</span>
                  <p className="text-[10px] text-secondary/60">{l.description}</p>
                </div>
                <Icon
                  name={layout === l.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                  className={layout === l.id ? 'text-emerald-400' : 'text-secondary/40'}
                />
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-secondary/70">Resume</h3>
          <button className="flex w-full items-center justify-center gap-2 rounded bg-[#007ACC] px-4 py-3 text-xs font-medium text-white transition-colors hover:bg-[#005A9E]">
            <Icon name="download" className="text-[16px]" />
            Download Resume (PDF)
          </button>
        </section>
      </div>
    </Modal>
  )
}
