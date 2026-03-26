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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 text-2xl font-bold text-on-accent shadow-lg shadow-accent/20 ring-2 ring-accent/10">
            AN
          </div>
          <div>
            <h2 className="text-lg font-semibold text-on-surface">{aboutContent.name}</h2>
            <p className="text-xs text-secondary/70">{aboutContent.role}</p>
            <div className="mt-1 flex items-center gap-2">
              {aboutContent.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] text-secondary/80"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-secondary/80">{aboutContent.bio}</p>

        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-secondary/70">
            Professional Summary
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group flex items-center gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-container-low hover:shadow-md hover:shadow-black/10"
              >
                <Icon
                  name={stat.icon}
                  className={`text-lg ${stat.highlight ? 'text-accent' : 'text-secondary/60'}`}
                />
                <div>
                  <p className={`text-xs ${stat.highlight ? 'text-accent' : 'text-on-surface'}`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-secondary/60">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-secondary/70">Connect</h3>
          <div className="space-y-2">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-container-low hover:shadow-md hover:shadow-black/10"
              >
                <div className="flex items-center gap-2">
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
                    className="text-[16px] text-secondary/60"
                  />
                  <span className="text-xs text-on-surface">{social.label}</span>
                </div>
                <span className="text-[10px] text-secondary/60">{social.value}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  )
}
