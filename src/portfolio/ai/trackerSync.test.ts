import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { handleChatRequest, type KvStore } from '../../../worker/chat'

// Browser stand-ins: the stores read localStorage when they load, and sync uses timers
// and visibility events.
const storage = new Map<string, string>()
const fakeWindow = Object.assign(new EventTarget(), {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  },
  setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms) as unknown as number,
  clearTimeout: (id: number) => clearTimeout(id),
})
const fakeDocument = Object.assign(new EventTarget(), { visibilityState: 'visible' })

// The "server": the real Worker code with an in-memory KV.
const kvData = new Map<string, string>()
const kv: KvStore = {
  get: async (key) => kvData.get(key) ?? null,
  put: async (key, value) => void kvData.set(key, value),
}
const serverDoc = () => JSON.parse(kvData.get('owner') ?? '{}')

const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

let sync: typeof import('./trackerSync')
let applications: typeof import('./useApplications')
let applyAnyway: typeof import('./useApplyAnyway')

beforeAll(async () => {
  // Ignore a local `VITE_TRACKER_SYNC=off` in .env.local: these tests need sync on.
  vi.stubEnv('VITE_TRACKER_SYNC', '')
  vi.stubGlobal('window', fakeWindow)
  vi.stubGlobal('document', fakeDocument)
  vi.stubGlobal('fetch', (_input: RequestInfo | URL, init?: RequestInit) =>
    handleChatRequest(new Request('http://localhost/api/chat', init as RequestInit), { OWNER_PASSCODE: 'open-sesame', TRACKER: kv }, 'sync-test'),
  )
  // Saved on this device before sync existed: no updatedAt, plain-URL apply-anyway list.
  storage.set('vscode-akaza-applications', JSON.stringify([
    { id: 'local-1', company: 'Acme', title: 'React Dev', url: 'https://a.dev/1', email: '', subject: '', appliedAt: '2026-10-20T00:00:00.000Z', via: 'portal', note: '' },
  ]))
  storage.set('vscode-akaza-apply-anyway', JSON.stringify(['https://naukri.com/9']))
  // Saved from another device.
  kvData.set('owner', JSON.stringify({
    version: 4,
    updatedAt: '2026-10-25T00:00:00.000Z',
    applications: [{ id: 'remote-1', company: 'Beta', title: 'Go Dev', url: 'https://b.dev/2', appliedAt: '2026-10-25T00:00:00.000Z', via: 'gmail', updatedAt: '2026-10-25T00:00:00.000Z' }],
    feedback: [],
    applyAnyway: [],
  }))
  applications = await import('./useApplications')
  applyAnyway = await import('./useApplyAnyway')
  sync = await import('./trackerSync')
})

afterAll(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('tracker sync', () => {
  let stop: () => void

  it('merges this device with the server copy on unlock and saves the union', async () => {
    stop = sync.startTrackerSync('open-sesame', { saveDelayMs: 0 })
    await settle()
    expect(applications.getApplications().map((entry) => entry.id).sort()).toEqual(['local-1', 'remote-1'])
    expect(applyAnyway.getApplyAnyway()).toEqual(['https://naukri.com/9'])
    expect(serverDoc().version).toBe(5)
    expect(serverDoc().applications.map((entry: { id: string }) => entry.id).sort()).toEqual(['local-1', 'remote-1'])
    expect(sync.getTrackerSyncStatus().state).toBe('synced')
  })

  it('sends an undo as a tombstone, so other devices drop it too', async () => {
    applications.unmarkApplied('remote-1')
    await settle()
    expect(applications.getApplications().map((entry) => entry.id)).toEqual(['local-1'])
    const remote = serverDoc().applications.find((entry: { id: string }) => entry.id === 'remote-1')
    expect(remote).toMatchObject({ deleted: true })
    expect(serverDoc().version).toBe(6)
  })

  it('merges in a save from another device when its own save conflicts', async () => {
    // Another device saved version 7 with a new application in the meantime.
    const doc = serverDoc()
    doc.version = 7
    doc.applications.push({ id: 'other-device', company: 'Gamma', title: 'UI Dev', url: 'https://c.dev/3', appliedAt: '2026-10-29T00:00:00.000Z', via: 'portal', updatedAt: '2026-10-29T00:00:00.000Z' })
    kvData.set('owner', JSON.stringify(doc))

    applications.markApplied({ company: 'Delta', title: 'Frontend Dev', url: 'https://d.dev/4' })
    await settle()
    const ids = applications.getApplications().map((entry) => entry.id)
    expect(ids).toContain('other-device')
    expect(ids).toContain('local-1')
    expect(serverDoc().version).toBe(8)
    expect(serverDoc().applications.some((entry: { company: string }) => entry.company === 'Delta')).toBe(true)
    expect(sync.getTrackerSyncStatus().state).toBe('synced')
  })

  it('only uploads edits made in this tab, not another tab\'s saves', async () => {
    const version = serverDoc().version
    // Another tab saved: this tab reloads the list, but must not upload it again.
    storage.set('vscode-akaza-applications', storage.get('vscode-akaza-applications') ?? '[]')
    fakeWindow.dispatchEvent(Object.assign(new Event('storage'), { key: 'vscode-akaza-applications' }))
    await settle()
    expect(serverDoc().version).toBe(version)
  })

  it('stops retrying when the server rejects the data as invalid or too large', async () => {
    stop()
    let calls = 0
    vi.stubGlobal('fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1
      const body = JSON.parse(String(init?.body))
      return body.tracker.get
        ? Response.json({ version: 0, updatedAt: '', applications: [], feedback: [], applyAnyway: [] })
        : Response.json({ error: 'Tracker is too large to sync.' }, { status: 413 })
    })
    stop = sync.startTrackerSync('open-sesame', { saveDelayMs: 0, retryMs: 5 })
    await settle()
    expect(sync.getTrackerSyncStatus()).toMatchObject({ state: 'error', message: expect.stringContaining('too big') })
    const afterFailure = calls
    await settle()
    expect(calls).toBe(afterFailure)
  })

  it('stops cleanly and stays off without the server binding', async () => {
    stop()
    expect(sync.getTrackerSyncStatus().state).toBe('off')
    vi.stubGlobal('fetch', (_input: RequestInfo | URL, init?: RequestInit) =>
      handleChatRequest(new Request('http://localhost/api/chat', init as RequestInit), { OWNER_PASSCODE: 'open-sesame' }, 'sync-test-2'),
    )
    stop = sync.startTrackerSync('open-sesame', { saveDelayMs: 0 })
    await settle()
    expect(sync.getTrackerSyncStatus().state).toBe('unconfigured')
    stop()
  })
})
