import { describe, expect, it } from 'vitest'
import { applicationKey, createApplication, matchApplication, mergeApplications } from './applications'
import { parseChatInput } from './slashCommands'

const target = { company: 'Capco', title: 'Sr. Front End Engineer', url: 'https://boards.greenhouse.io/capco/1' }

describe('applicationKey', () => {
  it('matches the same role written differently, not other companies', () => {
    expect(applicationKey('Capco', 'Sr. Front End Engineer')).toBe(applicationKey('CAPCO', 'Senior Frontend Engineer'))
    expect(applicationKey('Capco', 'Senior Frontend Engineer')).not.toBe(applicationKey('Acme', 'Senior Frontend Engineer'))
  })

  it('refuses vague roles, so they only match by URL', () => {
    expect(applicationKey('Unknown company', 'Frontend Developer')).toBeNull()
    expect(applicationKey('Acme', 'フロントエンド')).toBeNull()
    const list = [createApplication({ company: 'Unknown company', title: 'Frontend Developer', url: 'https://a.dev/1' })]
    expect(matchApplication(list, { company: 'Unknown company', title: 'Frontend Developer', url: 'https://b.dev/2' })).toBeUndefined()
    expect(matchApplication(list, { company: 'Unknown company', title: 'Frontend Developer', url: 'https://a.dev/1' })?.entry).toBe(list[0])
  })
})

describe('matchApplication', () => {
  const appliedOn = new Date('2026-10-01T09:00:00Z')
  const list = [createApplication(target, { via: 'gmail', email: 'hr@capco.com' }, appliedOn)]
  const sameRole = { company: 'Capco', title: 'Senior Frontend Engineer', url: 'https://builtin.com/job/9' }
  const daysLater = (days: number) => appliedOn.getTime() + days * 24 * 60 * 60_000
  const status = (job: Parameters<typeof matchApplication>[1], options?: Parameters<typeof matchApplication>[2]) =>
    matchApplication(list, job, options)?.status

  it('treats the same URL as applied, whatever the date', () => {
    expect(status({ company: 'Other', title: 'Other', url: target.url, postedAt: '2026-12-01' }, { now: daysLater(200) })).toBe('applied')
  })

  it('treats the same company and title as the same role within 60 days when undated', () => {
    expect(status(sameRole, { now: daysLater(59) })).toBe('sameRole')
    expect(status(sameRole, { now: daysLater(60) })).toBe('repost')
    expect(status({ company: 'Capco', title: 'Backend Engineer', url: 'https://x.dev/2' })).toBeUndefined()
  })

  it('uses a stated posting date over the 60-day rule', () => {
    expect(status({ ...sameRole, postedAt: '2026-10-05' }, { now: daysLater(10) })).toBe('repost')
    expect(status({ ...sameRole, postedAt: '2026-10-01' }, { now: daysLater(10) })).toBe('sameRole')
    expect(status({ ...sameRole, postedAt: '2026-09-20' }, { now: daysLater(200) })).toBe('sameRole')
  })

  it('moves a same-role match to "apply anyway" when the owner says so', () => {
    expect(status(sameRole, { now: daysLater(5), applyAnyway: [sameRole.url] })).toBe('applyAnyway')
    expect(status(sameRole, { now: daysLater(5), applyAnyway: ['https://other.dev/1'] })).toBe('sameRole')
  })

  it('counts a separate application for the repost as applied, by URL', () => {
    const both = [...list, createApplication(sameRole, {}, new Date(daysLater(70)))]
    expect(matchApplication(both, sameRole, { now: daysLater(71) })).toMatchObject({ status: 'applied', entry: both[1] })
  })
})

describe('mergeApplications', () => {
  it('dedupes and keeps the earliest date', () => {
    const early = createApplication(target, {}, new Date('2026-10-01T00:00:00Z'))
    const late = createApplication(target, {}, new Date('2026-10-20T00:00:00Z'))
    const other = createApplication({ company: 'Acme', title: 'React Dev', url: '' }, {}, new Date('2026-10-10T00:00:00Z'))
    const result = mergeApplications([late], [early, other])
    expect(result).toMatchObject({ added: 1, skipped: 1 })
    expect(result.list).toHaveLength(2)
    expect(result.list.find((entry) => entry.company === 'Capco')?.appliedAt).toBe('2026-10-01T00:00:00.000Z')
  })

  it('keeps the same role on two different posting URLs separate, even days apart', () => {
    const first = createApplication(target, {}, new Date('2026-10-01T00:00:00Z'))
    const repost = createApplication({ ...target, url: 'https://naukri.com/9' }, {}, new Date('2026-10-11T00:00:00Z'))
    expect(mergeApplications([first], [repost]).list).toHaveLength(2)
  })

  it('folds the same role without URLs within 60 days', () => {
    const first = createApplication({ ...target, url: '' }, {}, new Date('2026-10-01T00:00:00Z'))
    const again = createApplication({ ...target, url: '' }, {}, new Date('2026-10-11T00:00:00Z'))
    expect(mergeApplications([first], [again]).list).toHaveLength(1)
  })

  it('keeps applications for the same role 60+ days apart as separate', () => {
    const first = createApplication(target, {}, new Date('2026-06-01T00:00:00Z'))
    const again = createApplication({ ...target, url: 'https://naukri.com/9' }, {}, new Date('2026-10-01T00:00:00Z'))
    expect(mergeApplications([first], [again]).list).toHaveLength(2)
  })
})

describe('/applied command', () => {
  it('parses as a panel command', () => {
    expect(parseChatInput('/applied')).toEqual({ kind: 'command', name: 'applied' })
  })
})
