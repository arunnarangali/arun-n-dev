import { beforeAll, describe, expect, it, vi } from 'vitest'
import { APPLICATIONS_STORAGE_KEY, createApplication, localApplicationStore, type Application } from './applications'

// Minimal browser stand-ins: the store reads window/localStorage when it loads.
const storage = new Map<string, string>()
const fakeWindow = Object.assign(new EventTarget(), {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  },
})

let store: typeof import('./useApplications')

beforeAll(async () => {
  vi.stubGlobal('window', fakeWindow)
  store = await import('./useApplications')
})

const otherTabSaves = (list: Application[]) => storage.set(APPLICATIONS_STORAGE_KEY, JSON.stringify(list))

describe('applications store across tabs', () => {
  it('keeps entries another tab saved, even without a storage event', () => {
    otherTabSaves([createApplication({ company: 'Capco', title: 'React Developer', url: 'https://a.dev/1' })])
    store.markApplied({ company: 'Acme', title: 'Frontend Engineer', url: 'https://b.dev/2' })
    const saved = JSON.parse(storage.get(APPLICATIONS_STORAGE_KEY) ?? '[]') as Application[]
    expect(saved.map((entry) => entry.company).sort()).toEqual(['Acme', 'Capco'])
  })

  it('picks up other tabs\' changes while nothing is mounted', () => {
    otherTabSaves([createApplication({ company: 'Beta', title: 'Go Engineer', url: 'https://c.dev/3' })])
    fakeWindow.dispatchEvent(Object.assign(new Event('storage'), { key: APPLICATIONS_STORAGE_KEY }))
    expect(store.getApplications().map((entry) => entry.company)).toEqual(['Beta'])
  })
})

describe('renamed storage keys', () => {
  const LEGACY = 'vscode-jarvis-applications'

  it('moves applications from the old key on load and removes it', () => {
    storage.clear()
    storage.set(LEGACY, JSON.stringify([createApplication({ company: 'Old', title: 'React Dev', url: 'https://d.dev/4' })]))
    expect(localApplicationStore.load().map((entry) => entry.company)).toEqual(['Old'])
    expect(storage.has(LEGACY)).toBe(false)
    expect(JSON.parse(storage.get(APPLICATIONS_STORAGE_KEY) ?? '[]')).toHaveLength(1)
  })

  it('merges both keys when both exist, losing nothing', () => {
    storage.clear()
    storage.set(APPLICATIONS_STORAGE_KEY, JSON.stringify([createApplication({ company: 'New', title: 'Go Dev', url: 'https://e.dev/5' })]))
    storage.set(LEGACY, JSON.stringify([createApplication({ company: 'Old', title: 'React Dev', url: 'https://d.dev/4' })]))
    expect(localApplicationStore.load().map((entry) => entry.company).sort()).toEqual(['New', 'Old'])
    expect(storage.has(LEGACY)).toBe(false)
  })

  it('picks up an old-version tab writing the old key', () => {
    storage.clear()
    storage.set(LEGACY, JSON.stringify([createApplication({ company: 'Older tab', title: 'UI Dev', url: 'https://f.dev/6' })]))
    fakeWindow.dispatchEvent(Object.assign(new Event('storage'), { key: LEGACY }))
    expect(store.getApplications().map((entry) => entry.company)).toEqual(['Older tab'])
    expect(storage.has(LEGACY)).toBe(false)
  })

  it('keeps a saved voice mute from the old key', async () => {
    storage.clear()
    storage.set('vscode-jarvis-voice', 'off')
    const { readVoiceOn, saveVoiceOn } = await import('./voicePreference')
    expect(readVoiceOn()).toBe(false)
    expect(storage.has('vscode-jarvis-voice')).toBe(false)
    saveVoiceOn(true)
    expect(readVoiceOn()).toBe(true)
  })
})
