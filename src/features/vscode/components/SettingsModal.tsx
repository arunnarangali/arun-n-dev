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
      <div className="space-y-6 font-sans">
        <section>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`group flex flex-col items-center gap-1.5 rounded-md border transition-all ${theme === t.id
                  ? 'border-primary bg-primary/10'
                  : 'border-outline-variant/40 bg-surface-container-lowest/50 hover:border-accent/40 hover:bg-surface-container-low hover:text-accent'
                  } ${layout === 'compact' ? 'p-2' : 'p-3'}`}
              >
                <Icon name={t.icon} className={`text-[18px] transition-colors ${theme === t.id ? 'text-primary' : 'text-on-surface group-hover:text-accent'}`} />
                <span className={`text-[10px] font-medium transition-colors ${theme === t.id ? 'text-primary' : 'text-on-surface group-hover:text-accent'}`}>{t.label}</span>
                {theme === t.id && <div className="h-0.5 w-4 bg-primary rounded-full mt-0.5" />}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Editor & Layout</h3>
          <div className="flex flex-col border-t border-outline-variant/20 divide-y divide-outline-variant/20">
            {/* Layout Toggle */}
            {layouts.map((l) => (
              <div 
                key={l.id}
                onClick={() => setLayout(l.id)}
                className="flex items-start justify-between py-3 cursor-pointer group"
              >
                <div className="pr-4">
                  <span className={`text-[12px] font-bold transition-colors ${layout === l.id ? 'text-primary' : 'text-on-surface'}`}>
                    {l.label}
                  </span>
                  <p className="text-[11px] text-on-surface-variant/60 leading-tight mt-0.5 transition-colors group-hover:text-accent/70">{l.description}</p>
                </div>
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                  layout === l.id ? 'border-primary bg-primary' : 'border-outline-variant/60 group-hover:border-accent/40'
                }`}>
                  {layout === l.id && <div className="h-1.5 w-1.5 rounded-full bg-on-primary" />}
                </div>
              </div>
            ))}

            {/* Single Page Toggle */}
            <div className="pt-3">
              <div 
                onClick={() => setPendingSinglePage(!singlePage)}
                className="flex items-start justify-between cursor-pointer group pb-3"
              >
                <div className="pr-4">
                  <span className={`text-[12px] font-bold transition-colors ${singlePage ? 'text-primary' : 'text-on-surface'}`}>
                    Single page mode
                  </span>
                  <p className="text-[11px] text-on-surface-variant/60 leading-tight mt-0.5 transition-colors group-hover:text-accent/70">Scroll all sections; tabs follow automatically. Code is view-only.</p>
                </div>
                <div className={`mt-1 flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-all ${
                  singlePage ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/40 group-hover:border-accent/40'
                }`}>
                  <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${singlePage ? 'translate-x-3' : 'translate-x-0'}`} />
                </div>
              </div>

              {pendingSinglePage !== null && (
                <div className="mb-3 px-1">
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
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-container h-10 text-[11px] font-bold text-on-primary transition-all hover:bg-primary border border-primary/20">
            <Icon name="download" className="text-[16px]" />
            DOWNLOAD RESUME (PDF)
          </button>
        </section>
      </div>
    </Modal>
  )
}
