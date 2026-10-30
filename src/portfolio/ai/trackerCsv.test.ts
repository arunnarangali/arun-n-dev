import { describe, expect, it } from 'vitest'
import { createApplication } from './applications'
import { createJobFeedback } from './jobFeedback'
import { parseTrackerCsv, RESULTS_COLUMNS, toResultsCsv, toResultsRow, toTrackerCsv, type ResultsRow } from './trackerCsv'
import { matchApplication } from './jobs'

const empty = { applications: [], feedback: [], applyAnyway: [] }

describe('tracker CSV', () => {
  it('round-trips applications, Not a fit and Apply anyway rows', () => {
    const application = createApplication(
      { company: 'Acme, Inc.', title: 'React "UI" Dev', url: 'https://acme.com/jobs/1' },
      { subject: '=HYPERLINK("x")', note: 'line 1\nline 2', via: 'gmail' },
      new Date('2026-10-28T10:00:00Z'),
    )
    const feedback = createJobFeedback(
      { company: 'Big', title: 'Staff Engineer', url: 'https://big.dev/1' },
      'above-experience',
      'needs 8+ yrs',
      new Date('2026-10-29T10:00:00Z'),
    )
    const csv = toTrackerCsv({ applications: [application], feedback: [feedback], applyAnyway: ['https://naukri.com/2'] })
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('status,date,company,title,url,via,email,subject,reason,note')
    expect(lines.slice(1).map((line) => line.split(',')[0])).toEqual(['Applied', 'Not a fit', 'Apply anyway'])
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`)

    const parsed = parseTrackerCsv(csv)
    expect(parsed.invalid).toBe(0)
    expect(parsed.applications[0]).toMatchObject({
      company: 'Acme, Inc.',
      title: 'React "UI" Dev',
      subject: '=HYPERLINK("x")',
      note: 'line 1\nline 2',
      via: 'gmail',
      appliedAt: '2026-10-28T10:00:00.000Z',
    })
    expect(parsed.feedback[0]).toMatchObject({
      company: 'Big',
      title: 'Staff Engineer',
      reason: 'above-experience',
      note: 'needs 8+ yrs',
      createdAt: '2026-10-29T10:00:00.000Z',
    })
    expect(parsed.applyAnyway).toEqual(['https://naukri.com/2'])
  })

  it('still imports tracker files that used the old kind column', () => {
    const csv = [
      'kind,date,company,title,url,email,subject,via,reason,note',
      'application,2026-10-01,Capco,React Dev,https://a.dev/1,,,portal,,',
      'not_a_fit,2026-10-02,Big,Staff Engineer,,,,,above-experience,',
      'apply_anyway,,,,https://naukri.com/2,,,,,',
    ].join('\r\n')
    const parsed = parseTrackerCsv(csv)
    expect(parsed).toMatchObject({ invalid: 0, applyAnyway: ['https://naukri.com/2'] })
    expect(parsed.applications).toHaveLength(1)
    expect(parsed.feedback).toHaveLength(1)
  })

  it('marks imported rows as changed now, so a restore beats an earlier deletion', () => {
    const before = Date.now()
    const parsed = parseTrackerCsv('status,date,company,title,url,reason\r\nApplied,2026-01-05,Capco,React Dev,https://a.dev/1,\r\nNot a fit,2026-01-06,Big,Staff Engineer,,salary')
    expect(parsed.applications[0].appliedAt).toBe('2026-01-05T00:00:00.000Z')
    expect(Date.parse(parsed.applications[0].updatedAt ?? '')).toBeGreaterThanOrEqual(before)
    expect(Date.parse(parsed.feedback[0].updatedAt ?? '')).toBeGreaterThanOrEqual(before)
  })

  it('still imports older application-only CSVs', () => {
    const csv = '﻿applied_at,company,title,url,email,subject,via,note\r\n2026-10-01,Capco,React Dev,https://a.dev/1,,,portal,\r\n'
    const parsed = parseTrackerCsv(csv)
    expect(parsed.applications.map((entry) => entry.company)).toEqual(['Capco'])
    expect(parsed.feedback).toEqual([])
  })

  it('accepts any column order and counts invalid rows', () => {
    const csv = [
      'title,company,date,status,reason,url',
      'React Dev,Acme,2026-10-01,,,',
      ',Missing title,2026-10-01,application,,',
      'Go Dev,Beta,not a date,application,,',
      'Java Dev,Gamma,,not_a_fit,made-up-reason,',
      'Java Dev,Gamma,,not_a_fit,wrong-stack,',
      ',,,apply_anyway,,',
      ',,,something_else,,https://x.dev',
    ].join('\n')
    const parsed = parseTrackerCsv(csv)
    expect(parsed.applications.map((entry) => entry.title)).toEqual(['React Dev'])
    expect(parsed.feedback.map((entry) => entry.reason)).toEqual(['wrong-stack'])
    expect(parsed.invalid).toBe(5)
    expect(parseTrackerCsv('')).toEqual({ ...empty, invalid: 0 })
  })
})

describe('results CSV', () => {
  const row = (overrides: Partial<ResultsRow>): ResultsRow => ({
    ...(Object.fromEntries(RESULTS_COLUMNS.map((column) => [column, ''])) as ResultsRow),
    ...overrides,
  })

  it('writes one row per job with its status, guarding formulas', () => {
    const csv = toResultsCsv([
      row({ '#': '1', status: 'Applied', applied_on: '2026-10-30', title: 'React Developer', company: 'SRM' }),
      row({ '#': '2', status: 'Not applied', title: '=HYPERLINK("x")', company: 'Acme, Inc.' }),
      row({ '#': '3', status: 'Not a fit', not_a_fit_reason: 'Above my experience' }),
    ])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe(RESULTS_COLUMNS.join(','))
    expect(lines).toHaveLength(4)
    expect(lines[1].startsWith('1,Applied,2026-10-30,')).toBe(true)
    expect(lines[2]).toContain(`"'=HYPERLINK(""x"")"`)
    expect(lines[2]).toContain('"Acme, Inc."')
    expect(lines[3]).toContain('Not a fit')
  })
})

describe('toResultsRow', () => {
  const job = (overrides: Record<string, unknown> = {}) => ({
    number: 1, fit: { score: 80 }, title: 'React Developer', company: 'SRM Technologies', location: 'Chennai', workMode: 'remote' as const,
    experience: '3-5 years', salary: '', postedAt: '', url: 'https://builtin.com/job/1', skills: [], summary: '', contactEmail: '', ...overrides,
  })
  const appliedOn = new Date(Date.now() - 5 * 24 * 60 * 60_000)

  it('marks applied, same role, not a fit and not applied jobs', () => {
    const applications = [createApplication({ company: 'SRM Technologies', title: 'React Developer', url: 'https://builtin.com/job/1' }, { via: 'gmail', email: 'hr@srm.com' }, appliedOn)]
    const exact = toResultsRow(job(), matchApplication(applications, job()), undefined)
    expect(exact).toMatchObject({ status: 'Applied', applied_on: appliedOn.toISOString().slice(0, 10), applied_via: 'Gmail (hr@srm.com)', fit: '80%', work_mode: 'remote' })

    const reposted = job({ url: 'https://naukri.com/9' })
    expect(toResultsRow(reposted, matchApplication(applications, reposted), undefined).status).toBe('Applied (same role)')

    const notFit = createJobFeedback({ company: 'Big', title: 'Staff Engineer', url: 'u' }, 'above-experience', 'needs 8 yrs')
    expect(toResultsRow(job({ company: 'Big' }), undefined, notFit)).toMatchObject({ status: 'Not a fit', not_a_fit_reason: 'Above my experience', note: 'needs 8 yrs' })

    expect(toResultsRow(job({ company: 'Other' }), undefined, undefined)).toMatchObject({ status: 'Not applied', applied_on: '', applied_via: '' })
  })

  it('treats a repost and Apply anyway as not applied yet, noting the earlier application', () => {
    const old = [createApplication({ company: 'SRM Technologies', title: 'React Developer', url: 'https://old.dev/1' }, {}, new Date(Date.now() - 90 * 24 * 60 * 60_000))]
    const repost = job({ url: 'https://new.dev/2' })
    const row = toResultsRow(repost, matchApplication(old, repost), undefined)
    expect(row).toMatchObject({ status: 'Reposted', applied_on: '' })
    expect(row.note).toContain('Applied to an earlier posting on')
    const anyway = toResultsRow(repost, matchApplication(old, repost, { applyAnyway: [repost.url] }), undefined)
    expect(anyway.status).toBe('Apply anyway')
  })
})
