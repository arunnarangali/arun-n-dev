import { afterEach, describe, expect, it } from 'vitest'
import { mergeRecords, mergeTracker, sameTracker, sanitizeTracker, TOMBSTONE_TTL_MS, type SyncRecord } from './trackerDoc'
import { handleChatRequest, resetJobSearchState, type KvStore } from '../../../worker/chat'

const at = (iso: string) => `2026-10-${iso}T00:00:00.000Z`

describe('mergeRecords', () => {
  const now = Date.parse(at('30'))

  it('keeps the newer change per id and everything only one side has', () => {
    const a = [{ id: '1', updatedAt: at('01'), note: 'old' }, { id: '2', updatedAt: at('02') }]
    const b = [{ id: '1', updatedAt: at('05'), note: 'new' }, { id: '3', updatedAt: at('03') }]
    expect(mergeRecords(a, b, now)).toEqual([
      { id: '1', updatedAt: at('05'), note: 'new' },
      { id: '3', updatedAt: at('03') },
      { id: '2', updatedAt: at('02') },
    ])
  })

  it('lets a later delete beat an older copy, and an undo win a tie', () => {
    const live: SyncRecord[] = [{ id: '1', updatedAt: at('01') }]
    const deleted: SyncRecord[] = [{ id: '1', updatedAt: at('02'), deleted: true }]
    expect(mergeRecords(live, deleted, now)).toEqual(deleted)
    expect(mergeRecords(deleted, live, now)).toEqual(deleted)
    const tie = [{ id: '1', updatedAt: at('01'), deleted: true }]
    expect(mergeRecords(live, tie, now)).toEqual(tie)
    // Re-added after the delete: the newer live copy wins.
    expect(mergeRecords(deleted, [{ id: '1', updatedAt: at('03') }], now)).toEqual([{ id: '1', updatedAt: at('03') }])
  })

  it('drops tombstones older than the TTL', () => {
    const old = { id: 'x', updatedAt: new Date(now - TOMBSTONE_TTL_MS - 1).toISOString(), deleted: true }
    const recent = { id: 'y', updatedAt: new Date(now - 1000).toISOString(), deleted: true }
    expect(mergeRecords([old, recent], [], now).map((record) => record.id)).toEqual(['y'])
  })

  it('merges all three lists and compares them ignoring order', () => {
    const one = { applications: [{ id: 'a', updatedAt: at('01') }], feedback: [], applyAnyway: [{ id: 'u', updatedAt: at('01') }] }
    const two = { applications: [{ id: 'b', updatedAt: at('02') }], feedback: [{ id: 'f', updatedAt: at('02') }], applyAnyway: [] }
    const merged = mergeTracker(one, two, now)
    expect(merged.applications.map((record) => record.id)).toEqual(['b', 'a'])
    expect(sameTracker(merged, { ...merged, applications: [...merged.applications].reverse() })).toBe(true)
    expect(sameTracker(merged, one)).toBe(false)
  })
})

describe('mergeTracker across devices', () => {
  const now = Date.parse(at('30'))
  const app = (id: string, extra: Record<string, string>) => ({ id, updatedAt: at('10'), company: 'Acme', title: 'React Dev', appliedAt: at('10'), ...extra })

  it('folds the same application saved under different ids on two devices', () => {
    const laptop = { applications: [app('a1', { url: 'https://a.dev/1' })], feedback: [], applyAnyway: [] }
    const phone = { applications: [{ ...app('b7', { url: 'https://a.dev/1' }), updatedAt: at('11') }], feedback: [], applyAnyway: [] }
    expect(mergeTracker(laptop, phone, now).applications.map((record) => record.id)).toEqual(['b7'])
  })

  it('folds URL-less copies of one application, but keeps different postings apart', () => {
    const noUrl = { applications: [app('a1', { url: '' })], feedback: [], applyAnyway: [] }
    const noUrlCopy = { applications: [app('b1', { url: '' })], feedback: [], applyAnyway: [] }
    expect(mergeTracker(noUrl, noUrlCopy, now).applications).toHaveLength(1)
    const repost = { applications: [app('b2', { url: 'https://naukri.com/9' })], feedback: [], applyAnyway: [] }
    const original = { applications: [app('a2', { url: 'https://a.dev/1' })], feedback: [], applyAnyway: [] }
    expect(mergeTracker(original, repost, now).applications).toHaveLength(2)
  })

  it('keeps one Not a fit mark per role, the newer one', () => {
    const one = { applications: [], feedback: [{ id: 'f1', updatedAt: at('01'), company: 'Big', title: 'Sr. Engineer', reason: 'salary' }], applyAnyway: [] }
    const two = { applications: [], feedback: [{ id: 'f2', updatedAt: at('02'), company: 'big', title: 'Senior Engineer', reason: 'above-experience' }], applyAnyway: [] }
    expect(mergeTracker(one, two, now).feedback).toEqual(two.feedback)
  })
})

describe('sanitizeTracker', () => {
  it('drops unknown fields, cuts long text and rejects malformed records', () => {
    const clean = sanitizeTracker({
      applications: [{ id: 'a', updatedAt: at('01'), company: 'Acme', note: 'x'.repeat(900), secret: 'drop me', deleted: true }],
    })
    expect(clean?.applications[0]).toEqual({ id: 'a', updatedAt: at('01'), company: 'Acme', note: 'x'.repeat(500), deleted: true })
    expect(clean?.feedback).toEqual([])
    expect(sanitizeTracker({ applications: [{ company: 'no id' }] })).toBeNull()
    expect(sanitizeTracker({ feedback: [{ id: 'f', title: 5 }] })).toBeNull()
    expect(sanitizeTracker({ applyAnyway: 'nope' })).toBeNull()
    expect(sanitizeTracker(null)).toBeNull()
  })
})

describe('worker tracker sync', () => {
  const fakeKv = () => {
    const data = new Map<string, string>()
    const kv: KvStore = {
      get: async (key) => data.get(key) ?? null,
      put: async (key, value) => void data.set(key, value),
    }
    return { kv, data }
  }
  let client = 0
  const post = (body: unknown, env: Record<string, unknown>, passcode = 'open-sesame', clientId = `tracker-${(client += 1)}`) =>
    handleChatRequest(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Owner-Passcode': passcode },
        body: JSON.stringify(body),
      }),
      { OWNER_PASSCODE: 'open-sesame', ...env },
      clientId,
    )

  afterEach(() => resetJobSearchState())

  it('is owner only and reports a missing KV binding', async () => {
    const { kv } = fakeKv()
    expect((await post({ tracker: { get: true } }, { TRACKER: kv }, 'wrong')).status).toBe(403)
    expect((await post({ tracker: { get: true } }, {})).status).toBe(503)
  })

  it('saves with a version check and returns 409 with the current copy', async () => {
    const { kv, data } = fakeKv()
    const env = { TRACKER: kv }
    expect(await (await post({ tracker: { get: true } }, env)).json()).toMatchObject({ version: 0, applications: [] })

    const lists = { applications: [{ id: 'a', updatedAt: at('01'), company: 'Acme', title: 'Dev', url: 'u' }], feedback: [], applyAnyway: [] }
    const saved = await post({ tracker: { put: lists, baseVersion: 0 } }, env)
    expect(await saved.json()).toMatchObject({ version: 1 })
    expect(JSON.parse(data.get('owner') ?? '{}')).toMatchObject({ version: 1, applications: lists.applications })

    const stale = await post({ tracker: { put: { applications: [] }, baseVersion: 0 } }, env)
    expect(stale.status).toBe(409)
    expect(await stale.json()).toMatchObject({ current: { version: 1, applications: lists.applications } })
    expect(await (await post({ tracker: { get: true } }, env)).json()).toMatchObject({ version: 1 })
  })

  it('never treats a failed read as an empty tracker', async () => {
    const kv: KvStore = {
      get: async () => {
        throw new Error('KV down')
      },
      put: async () => {
        throw new Error('must not write')
      },
    }
    expect((await post({ tracker: { get: true } }, { TRACKER: kv })).status).toBe(502)
    expect((await post({ tracker: { put: { applications: [] }, baseVersion: 0 } }, { TRACKER: kv })).status).toBe(502)
  })

  it('backs up a damaged document and bumps the version, so old saves conflict', async () => {
    const { kv, data } = fakeKv()
    data.set('owner', JSON.stringify({ version: 7, applications: 'broken' }))
    const doc = await (await post({ tracker: { get: true } }, { TRACKER: kv })).json()
    expect(doc).toMatchObject({ version: 8, applications: [] })
    const backup = [...data.keys()].find((key) => key.startsWith('owner-damaged-'))
    expect(backup && JSON.parse(data.get(backup) ?? '{}')).toMatchObject({ version: 7, applications: 'broken' })
    // A device that last saw version 7 must merge first instead of overwriting.
    expect((await post({ tracker: { put: { applications: [] }, baseVersion: 7 } }, { TRACKER: kv })).status).toBe(409)
    expect((await post({ tracker: { put: { applications: [] }, baseVersion: 8 } }, { TRACKER: kv })).status).toBe(200)
  })

  it('rejects malformed or oversized saves without writing', async () => {
    const { kv, data } = fakeKv()
    const env = { TRACKER: kv }
    expect((await post({ tracker: { put: { applications: [{ no: 'id' }] }, baseVersion: 0 } }, env)).status).toBe(400)
    expect((await post({ tracker: { put: { applications: [] } } }, env)).status).toBe(400)
    const huge = { applications: Array.from({ length: 1500 }, (_, index) => ({ id: `a${index}`, note: 'x'.repeat(400) })) }
    expect((await post({ tracker: { put: huge, baseVersion: 0 } }, env)).status).toBe(413)
    expect(data.size).toBe(0)
  })

  it('counts wrong passcodes against the per-IP limit, so they can\'t be guessed', async () => {
    const { kv } = fakeKv()
    const statuses: number[] = []
    for (let attempt = 0; attempt < 13; attempt += 1)
      statuses.push((await post({ tracker: { get: true } }, { TRACKER: kv }, `guess-${attempt}`, 'guesser')).status)
    expect(statuses.slice(0, 12).every((status) => status === 403)).toBe(true)
    expect(statuses[12]).toBe(429)
  })

  it('measures the size limit in bytes, not characters', async () => {
    const { kv, data } = fakeKv()
    // ~120k characters: under the limit counted in characters, ~360 KB in UTF-8 bytes.
    const wide = { feedback: Array.from({ length: 600 }, (_, index) => ({ id: `f${index}`, note: 'あ'.repeat(200) })) }
    expect((await post({ tracker: { put: wide, baseVersion: 0 } }, { TRACKER: kv })).status).toBe(413)
    expect(data.size).toBe(0)
  })

  it('limits saves per client', async () => {
    const { kv } = fakeKv()
    const env = { TRACKER: kv }
    const statuses: number[] = []
    for (let version = 0; version < 31; version += 1)
      statuses.push((await post({ tracker: { put: { applications: [] }, baseVersion: version } }, env, 'open-sesame', 'tracker-writer')).status)
    expect(statuses.slice(0, 30).every((status) => status === 200)).toBe(true)
    expect(statuses[30]).toBe(429)
  })
})
