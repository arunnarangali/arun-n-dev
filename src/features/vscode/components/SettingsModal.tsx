import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import { Icon } from './Icon'
import { SinglePageConfirmCallout } from './SinglePageConfirmCallout'
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
  const { theme, setTheme, layout, setLayout, singlePage, setSinglePage } = useSettings()
  const [pendingSinglePage, setPendingSinglePage] = useState<boolean | null>(null)
  const [isApplyingSinglePage, setApplyingSinglePage] = useState(false)
  const applyTimeoutRef = useRef<number | null>(null)

  const handleClose = () => {
    setPendingSinglePage(null)
    setApplyingSinglePage(false)
    if (applyTimeoutRef.current !== null) {
      window.clearTimeout(applyTimeoutRef.current)
      applyTimeoutRef.current = null
    }
    onClose()
  }

  useEffect(() => {
    return () => {
      if (applyTimeoutRef.current !== null) {
        window.clearTimeout(applyTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Settings" icon="settings">
      <div className="space-y-4">
        <section>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary/70">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`group flex flex-col items-center gap-1 rounded-lg border transition-all duration-300 hover:-translate-y-0.5 hover:shadow hover:shadow-black/10 ${theme === t.id
                  ? 'border-accent/60 bg-accent/10 ring-1 ring-accent/20'
                  : 'border-outline-variant/60 bg-surface-container-lowest hover:border-accent/40'
                  } ${layout === 'compact' ? 'p-1.5' : 'p-2'}`}
              >
                <Icon name={t.icon} className="text-lg text-on-surface" />
                <span className={layout === 'compact' ? 'text-[9px]' : 'text-[10px]'} text-on-surface>{t.label}</span>
                {theme === t.id && <Icon name="check" className="text-accent text-[10px]" />}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary/70">Layout Mode</h3>
          <div className="space-y-1.5">
            {layouts.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                className={`group flex w-full items-center justify-between rounded-lg border p-2 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow hover:shadow-black/10 ${layout === l.id
                  ? 'border-accent/60 bg-accent/10 ring-1 ring-accent/20'
                  : 'border-outline-variant/60 bg-surface-container-lowest hover:border-accent/40 hover:bg-surface-container-low'
                  }`}
              >
                <div>
                  <span className="text-[11px] text-on-surface">{l.label}</span>
                  <p className="text-[9px] text-secondary/60">{l.description}</p>
                </div>
                <Icon
                  name={layout === l.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                  className={layout === l.id ? 'text-accent' : 'text-secondary/40'}
                />
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary/70">Editor</h3>
          <button
            onClick={() => setPendingSinglePage(!singlePage)}
            className={`group flex w-full items-center justify-between rounded-lg border p-2 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow hover:shadow-black/10 ${singlePage
              ? 'border-accent/60 bg-accent/10 ring-1 ring-accent/20'
              : 'border-outline-variant/60 bg-surface-container-lowest hover:border-accent/40 hover:bg-surface-container-low'
              }`}
          >
            <div>
              <span className="text-[11px] text-on-surface">Single page</span>
              <p className="text-[9px] text-secondary/60">Scroll all sections; tabs follow. Code is view-only.</p>
            </div>
            <Icon
              name={singlePage ? 'toggle_on' : 'toggle_off'}
              className={singlePage ? 'text-accent text-[20px]' : 'text-secondary/40 text-[20px]'}
            />
          </button>
          {pendingSinglePage !== null && (
            <SinglePageConfirmCallout
              pendingValue={pendingSinglePage}
              isApplying={isApplyingSinglePage}
              onCancel={() => setPendingSinglePage(null)}
              onConfirm={() => {
                if (pendingSinglePage === null) return
                setApplyingSinglePage(true)
                applyTimeoutRef.current = window.setTimeout(() => {
                  setSinglePage(pendingSinglePage)
                  setPendingSinglePage(null)
                  setApplyingSinglePage(false)
                  applyTimeoutRef.current = null
                }, 320)
              }}
            />
          )}
        </section>

        <section>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary/70">Resume</h3>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-3 py-2 text-[11px] font-medium text-on-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:shadow-md hover:shadow-primary/20">
            <Icon name="download" className="text-[14px]" />
            Download Resume (PDF)
          </button>
        </section>

      </div>
    </Modal>
  )
}
