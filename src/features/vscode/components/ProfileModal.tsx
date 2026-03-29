import { Modal } from './Modal'
import { Icon } from './Icon'
import { aboutContent, socials } from '../../../portfolio/content'

type ProfileModalProps = {
  isOpen: boolean
  onClose: () => void
}

type Stat = {
  label: string
  value: string
  icon: string
  highlight?: boolean
}

const stats: Stat[] = [
  { label: 'Experience', value: '7+ Years', icon: 'work_history' },
  { label: 'Projects', value: '24+', icon: 'folder_special' },
  { label: 'Companies', value: '5+', icon: 'domain' },
  { label: 'Status', value: 'Open to Work', icon: 'radio_button_checked', highlight: true },
]

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile" icon="account_circle">
      <div className="space-y-5 font-sans">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary text-xl font-bold text-on-primary shadow-sm">
            AN
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-on-surface truncate">{aboutContent.name}</h2>
            <p className="text-[12px] font-medium text-primary/80">{aboutContent.role}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {aboutContent.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant/80 border border-outline-variant/30"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[12px] leading-relaxed text-on-surface-variant/90">{aboutContent.bio}</p>

        <section>
          <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
            Professional Summary
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group flex items-center gap-3 rounded-md border border-outline-variant/40 bg-surface-container-lowest/50 p-2.5 transition-all hover:border-accent/40 hover:bg-surface-container-low"
              >
                <div className={`p-1.5 rounded bg-surface-container-high transition-colors group-hover:bg-accent/10`}>
                  <Icon
                    name={stat.icon}
                    className={`text-[16px] ${stat.highlight ? 'text-primary' : 'text-on-surface-variant/70'}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className={`text-[12px] font-bold transition-colors group-hover:text-accent ${stat.highlight ? 'text-primary' : 'text-on-surface'} truncate`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-on-surface-variant/60 truncate transition-colors group-hover:text-accent/70">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Connect</h3>
          <div className="grid gap-1.5">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-md border border-outline-variant/40 bg-surface-container-lowest/50 px-3 py-2 transition-all hover:border-accent/40 hover:bg-surface-container-low"
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    name={
                      social.label === 'Email'
                        ? 'mail'
                        : social.label === 'GitHub'
                          ? 'code'
                          : social.label === 'LinkedIn'
                            ? 'work'
                            : 'tag'
                    }
                    className="text-[16px] text-on-surface-variant/60 group-hover:text-accent transition-colors"
                  />
                  <span className="text-[12px] font-medium text-on-surface group-hover:text-accent transition-colors">{social.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-on-surface-variant/40 transition-colors group-hover:text-accent/60">{social.value}</span>
                  <Icon name="open_in_new" className="text-[12px] text-on-surface-variant/30 group-hover:text-accent/60" />
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  )
}
