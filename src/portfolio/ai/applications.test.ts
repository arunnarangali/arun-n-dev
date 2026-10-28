import { describe, expect, it } from 'vitest'
import { applicationKey, createApplication, findApplication, mergeApplications, parseCsv, toCsv } from './applications'
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
    expect(findApplication(list, { company: 'Unknown company', title: 'Frontend Developer', url: 'https://b.dev/2' })).toBeUndefined()
    expect(findApplication(list, { company: 'Unknown company', title: 'Frontend Developer', url: 'https://a.dev/1' })).toBe(list[0])
  })
})

describe('findApplication', () => {
  const list = [createApplication(target, { via: 'gmail', email: 'hr@capco.com' })]

  it('matches by URL or by company and title', () => {
    expect(findApplication(list, { company: 'Other', title: 'Other', url: target.url })).toBe(list[0])
    expect(findApplication(list, { company: 'Capco', title: 'Senior Frontend Engineer', url: 'https://builtin.com/job/9' })).toBe(list[0])
    expect(findApplication(list, { company: 'Capco', title: 'Backend Engineer', url: 'https://x.dev/2' })).toBeUndefined()
  })
})

describe('CSV', () => {
  it('round-trips tricky values and guards formulas', () => {
    const entry = createApplication(
      { company: 'Acme, Inc.', title: 'React "UI" Dev', url: 'https://acme.com/jobs/1' },
      { subject: '=HYPERLINK("x")', note: 'line 1\nline 2', via: 'gmail' },
      new Date('2026-10-28T10:00:00Z'),
    )
    const csv = toCsv([entry])
    expect(csv.split('\r\n')[0]).toBe('applied_at,company,title,url,email,subject,via,note')
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`)
    const [parsed] = parseCsv(csv)
    expect(parsed).toMatchObject({
      company: 'Acme, Inc.',
      title: 'React "UI" Dev',
      subject: '=HYPERLINK("x")',
      note: 'line 1\nline 2',
      via: 'gmail',
      appliedAt: '2026-10-28T10:00:00.000Z',
    })
  })

  it('accepts any column order and skips invalid rows', () => {
    const csv = '﻿title,company,applied_at\nReact Dev,Acme,2026-10-01\n,Missing title,2026-10-01\nGo Dev,Beta,not a date\n'
    expect(parseCsv(csv).map((entry) => entry.title)).toEqual(['React Dev'])
    expect(parseCsv('')).toEqual([])
  })
})

describe('mergeApplications', () => {
  it('dedupes and keeps the earliest date', () => {
    const early = createApplication(target, {}, new Date('2026-10-01T00:00:00Z'))
    const late = createApplication({ ...target, url: 'https://builtin.com/job/9' }, {}, new Date('2026-10-20T00:00:00Z'))
    const other = createApplication({ company: 'Acme', title: 'React Dev', url: '' }, {}, new Date('2026-10-10T00:00:00Z'))
    const result = mergeApplications([late], [early, other])
    expect(result).toMatchObject({ added: 1, skipped: 1 })
    expect(result.list).toHaveLength(2)
    expect(result.list.find((entry) => entry.company === 'Capco')?.appliedAt).toBe('2026-10-01T00:00:00.000Z')
  })
})

describe('/applied command', () => {
  it('parses as a panel command', () => {
    expect(parseChatInput('/applied')).toEqual({ kind: 'command', name: 'applied' })
  })
})
