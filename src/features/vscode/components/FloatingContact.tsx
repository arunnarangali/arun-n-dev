import { Icon } from './Icon'

const WHATSAPP_PLACEHOLDER = 'https://wa.me/1234567890'

export const FloatingContact = () => {
  return (
    <a
      href={WHATSAPP_PLACEHOLDER}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-16 right-4 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-xs font-medium text-on-accent shadow-lg shadow-black/30 transition-all hover:bg-accent/90 md:bottom-8 md:px-6"
    >
      <Icon name="chat" className="text-[20px]" />
      <span className="hidden md:inline">Get in Touch</span>
    </a>
  )
}
