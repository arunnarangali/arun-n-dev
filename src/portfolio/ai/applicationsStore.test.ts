import { beforeAll, describe, expect, it, vi } from 'vitest'
import { APPLICATIONS_STORAGE_KEY, createApplication, type Application } from './applications'

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
