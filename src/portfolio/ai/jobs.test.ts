import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildJobQueries, classifyLocation, classifyRoles, describeJobResult, MAX_JOBS, pageMentionsDate, parseAppliedJobs, parsePreferences, pickHrEmail, sanitizeJobs, sanitizeSkipped } from './jobs'
import { buildGmailComposeUrl, composeCoverLetterEmail, parseCoverLetter } from './coverLetter'
import { parseChatInput } from './slashCommands'
import { handleChatRequest, resetJobSearchState } from '../../../worker/chat'

const job = (overrides: Record<string, unknown> = {}) => ({
  title: 'React Developer',
  company: 'Acme',
  location: 'Bengaluru',
  workMode: 'onsite',
  url: 'https://example.com/jobs/1',
  skills: ['React', 'TypeScript'],
  summary: 'Build UI.',
  ...overrides,
})

describe('job classification', () => {
  it('groups locations, with remote taking priority', () => {
    expect(classifyLocation({ location: 'Infopark, Kochi', workMode: 'onsite' })).toBe('kerala')
    expect(classifyLocation({ location: 'Bengaluru, Karnataka', workMode: 'hybrid' })).toBe('bangalore')
    expect(classifyLocation({ location: 'Remote - India', workMode: 'unknown' })).toBe('remote')
    expect(classifyLocation({ location: 'Hyderabad', workMode: 'remote' })).toBe('remote')
    expect(classifyLocation({ location: 'Gurugram', workMode: 'onsite' })).toBe('metro')
    expect(classifyLocation({ location: 'Berlin', workMode: 'onsite' })).toBe('other')
  })

  it('tags roles from the title', () => {
    expect(classifyRoles('Sr. Frontend Engineer')).toEqual(['senior', 'frontend'])
    expect(classifyRoles('Full Stack Developer (React + Go)')).toEqual(['fullstack', 'frontend'])
    expect(classifyRoles('Data Analyst')).toEqual(['other'])
  })

  it('uses default queries unless the user gives one', () => {
    expect(buildJobQueries().join(' ')).toMatch(/remote.*Kerala/)
    expect(buildJobQueries('golang')).toEqual(expect.arrayContaining([expect.stringContaining('golang')]))
  })
})

describe('sanitizeJobs', () => {
  const allowed = new Set(['https://example.com/jobs/1', 'https://example.com/jobs/2'])

  it('keeps only valid listings whose URL came from search', () => {
    const jobs = sanitizeJobs(
      {
        jobs: [
          job(),
          job({ url: 'https://invented.example/jobs/9' }),
          job({ url: 'https://example.com/jobs/1' }),
          job({ title: '', url: 'https://example.com/jobs/2' }),
          job({ url: 'https://example.com/jobs/2', workMode: 'space', skills: 'React' }),
          'nonsense',
        ],
      },
      allowed,
    )
    expect(jobs.map((entry) => entry.url)).toEqual(['https://example.com/jobs/1', 'https://example.com/jobs/2'])
    expect(jobs[1]).toMatchObject({ workMode: 'unknown', skills: [] })
    expect(sanitizeJobs({ jobs: [job({ contactEmail: 'not an email' })] }, allowed)[0].contactEmail).toBe('')
    expect(sanitizeJobs({ jobs: [job({ contactEmail: 'HR@Acme.com' })] }, allowed)[0].contactEmail).toBe('hr@acme.com')
    expect(sanitizeJobs(null, allowed)).toEqual([])
  })

  it('caps the number of listings', () => {
    const urls = Array.from({ length: 40 }, (_, index) => `https://example.com/${index}`)
    expect(sanitizeJobs({ jobs: urls.map((url) => job({ url })) }, new Set(urls))).toHaveLength(MAX_JOBS)
  })
})

describe('/jobs command', () => {
  it('parses with and without a query', () => {
    expect(parseChatInput('/jobs')).toEqual({ kind: 'command', name: 'jobs' })
    expect(parseChatInput('/jobs golang remote')).toEqual({ kind: 'command', name: 'jobs', args: 'golang remote' })
  })
})

describe('worker job search', () => {
  const env = { OLLAMA_API_KEY: 'test-key', OWNER_PASSCODE: 'open-sesame' }
  let client = 0
  const post = (body: unknown, passcode?: string, clientId = `jobs-client-${(client += 1)}`) =>
    handleChatRequest(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: passcode ? { 'Content-Type': 'application/json', 'X-Owner-Passcode': passcode } : { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      env,
      clientId,
    )

  afterEach(() => {
    vi.restoreAllMocks()
    resetJobSearchState()
  })

  it('refuses visitors and bad queries without searching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    expect((await post({ jobs: {} })).status).toBe(403)
    expect((await post({ jobs: {} }, 'wrong')).status).toBe(403)
    expect((await post({ jobs: { query: 'x'.repeat(500) } }, 'open-sesame')).status).toBe(400)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('searches, extracts and drops invented URLs', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).endsWith('/api/web_search'))
        return Response.json({ results: [{ title: 'React Dev', url: 'https://example.com/jobs/1', content: 'React job' }] })
      return Response.json({
        message: { content: JSON.stringify({ jobs: [job(), job({ url: 'https://invented.example/x' })] }) },
      })
    })
    const response = await post({ jobs: { query: 'react' } }, 'open-sesame')
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.jobs.map((entry: { url: string }) => entry.url)).toEqual(['https://example.com/jobs/1'])
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('passes on upstream rate limits as 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('busy', { status: 429, headers: { 'Retry-After': '1600' } }))
    const response = await post({ jobs: {} }, 'open-sesame')
    expect(response.status).toBe(429)
    expect(await response.json()).toMatchObject({ retryAfter: 1600, error: expect.stringContaining('27 minutes') })
  })

  it('stops calling Ollama during the cool-down', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('busy', { status: 429, headers: { 'Retry-After': '600' } }))
    await post({ jobs: {} }, 'open-sesame')
    const second = await post({ jobs: {} }, 'open-sesame')
    expect(second.status).toBe(429)
    expect((await second.json()).retryAfter).toBeGreaterThan(590)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('serves repeat searches from cache unless fresh is set', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      String(input).endsWith('/api/web_search')
        ? Response.json({ results: [{ title: 'React Dev', url: 'https://example.com/jobs/1', content: 'React job' }] })
        : Response.json({ message: { content: JSON.stringify({ jobs: [job()] }) } }),
    )
    const first = await (await post({ jobs: { query: 'React' } }, 'open-sesame')).json()
    const calls = fetchSpy.mock.calls.length
    const second = await (await post({ jobs: { query: 'react ' } }, 'open-sesame')).json()
    expect(first.cached).toBeUndefined()
    expect(second).toMatchObject({ cached: true, jobs: first.jobs })
    expect(fetchSpy).toHaveBeenCalledTimes(calls)
    await post({ jobs: { query: 'react', fresh: true } }, 'open-sesame')
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(calls)
  })

  it('leaves out only the exact applied postings, even from the cache', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      String(input).endsWith('/api/web_search')
        ? Response.json({
            results: ['1', '2', '3'].map((id) => ({ title: 'Job', url: `https://example.com/jobs/${id}`, content: 'React job' })),
          })
        : Response.json({
            message: {
              content: JSON.stringify({
                jobs: [
                  job(),
                  job({ url: 'https://example.com/jobs/2', company: 'Beta', title: 'Sr. Front End Developer' }),
                  job({ url: 'https://example.com/jobs/3', company: 'Gamma' }),
                ],
              }),
            },
          }),
    )
    const first = await (
      await post({ jobs: { applied: [{ company: 'Other', title: 'x', url: 'https://example.com/jobs/1' }] } }, 'open-sesame')
    ).json()
    expect(first.jobs.map((entry: { company: string }) => entry.company)).toEqual(['Beta', 'Gamma'])
    expect(first.applied).toBe(1)

    // Applied later: left out of the cached result too. A same-role match on another
    // board stays, so the chat can show it and offer "Apply anyway".
    const applied = [
      { company: 'Other', title: 'x', url: 'https://example.com/jobs/1' },
      { company: 'Gamma', title: 'React Developer', url: 'https://example.com/jobs/3' },
      { company: 'beta', title: 'Senior Frontend Developer', url: 'https://elsewhere.dev/9' },
    ]
    const second = await (await post({ jobs: { applied } }, 'open-sesame')).json()
    expect(second).toMatchObject({ cached: true, applied: 2 })
    expect(second.jobs.map((entry: { company: string }) => entry.company)).toEqual(['Beta'])

    const none = await (await post({ jobs: {} }, 'open-sesame')).json()
    expect(none.jobs).toHaveLength(3)
    expect(none.applied).toBeUndefined()
  })

  it('rejects a malformed applied list without searching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    for (const applied of ['x', [{ company: 'A' }], Array(101).fill({ company: 'A', title: 'B', url: 'C' })])
      expect((await post({ jobs: { applied } }, 'open-sesame')).status).toBe(400)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects malformed feedback without searching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    for (const preferences of ['skip seniors', [1], Array(11).fill('x'), ['x'.repeat(151)]])
      expect((await post({ jobs: { preferences } }, 'open-sesame')).status).toBe(400)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('sends feedback to the extractor, reports skipped jobs and caches per feedback', async () => {
    const prompts: string[] = []
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (String(input).endsWith('/api/web_search'))
        return Response.json({ results: [{ title: 'React Dev', url: 'https://example.com/jobs/1', content: 'React job' }] })
      prompts.push(JSON.parse(String(init?.body)).messages[0].content)
      return Response.json({
        message: { content: JSON.stringify({ jobs: [job()], skipped: [{ title: 'Staff Engineer', company: 'Big', reason: 'above experience' }, { title: '' }] }) },
      })
    })
    const preferences = ['Above my experience, e.g. Staff Engineer at Big']
    const data = await (await post({ jobs: { preferences } }, 'open-sesame')).json()
    expect(prompts[0]).toContain('- Above my experience, e.g. Staff Engineer at Big')
    expect(data).toMatchObject({ preferences, skipped: [{ title: 'Staff Engineer', company: 'Big', reason: 'above experience' }] })

    const calls = fetchSpy.mock.calls.length
    expect((await (await post({ jobs: { preferences } }, 'open-sesame')).json()).cached).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(calls)
    const plain = await (await post({ jobs: {} }, 'open-sesame')).json()
    expect(plain.cached).toBeUndefined()
    expect(plain.skipped).toBeUndefined()
    expect(prompts.at(-1)).not.toContain('not a fit')
  })

  it('looks up HR emails once per company', async () => {
    expect((await post({ hrEmail: { company: 'Acme' } })).status).toBe(403)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json({ results: [{ title: 'Careers', url: 'https://acme.com/careers', content: 'Email careers@acme.com' }] }),
    )
    const first = await (await post({ hrEmail: { company: 'Acme' } }, 'open-sesame')).json()
    const second = await (await post({ hrEmail: { company: 'acme' } }, 'open-sesame')).json()
    expect(first).toEqual({ email: 'careers@acme.com', source: 'acme.com' })
    expect(second).toMatchObject({ email: 'careers@acme.com', cached: true })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not cache partial runs and reports the cool-down', async () => {
    let searches = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (!String(input).endsWith('/api/web_search'))
        return Response.json({ message: { content: JSON.stringify({ jobs: [job()] }) } })
      searches += 1
      return searches === 1
        ? Response.json({ results: [{ title: 'React Dev', url: 'https://example.com/jobs/1', content: 'React job' }] })
        : new Response('busy', { status: 429, headers: { 'Retry-After': '300' } })
    })
    const first = await (await post({ jobs: {} }, 'open-sesame')).json()
    expect(first).toMatchObject({ retryAfter: 300, jobs: [expect.objectContaining({ url: 'https://example.com/jobs/1' })] })
    // Not cached: the repeat gets the cool-down instead of the partial list.
    const second = await post({ jobs: {} }, 'open-sesame')
    expect(second.status).toBe(429)
    expect(searches).toBe(2)
  })

  it('marks runs with any failed search as partial and does not cache them', async () => {
    let searches = 0
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (!String(input).endsWith('/api/web_search'))
        return Response.json({ message: { content: JSON.stringify({ jobs: [job()] }) } })
      searches += 1
      return searches % 3 === 1
        ? Response.json({ results: [{ title: 'React Dev', url: 'https://example.com/jobs/1', content: 'React job' }] })
        : new Response('bad gateway', { status: 502 })
    })
    const first = await (await post({ jobs: {} }, 'open-sesame')).json()
    expect(first).toMatchObject({ partial: true })
    expect(first.retryAfter).toBeUndefined()
    const calls = fetchSpy.mock.calls.length
    const second = await (await post({ jobs: {} }, 'open-sesame')).json()
    expect(second.cached).toBeUndefined()
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(calls)
  })

  it('flags Ollama quota errors but not the per-client limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('busy', { status: 429, headers: { 'Retry-After': '120' } }))
    expect(await (await post({ jobs: {} }, 'open-sesame')).json()).toMatchObject({ quota: true, retryAfter: 120 })
    resetJobSearchState()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ results: [] }))
    for (let index = 0; index < 4; index += 1) await post({ jobs: {} }, 'open-sesame', 'quota-client')
    const limited = await (await post({ jobs: {} }, 'open-sesame', 'quota-client')).json()
    expect(limited.retryAfter).toBeGreaterThan(0)
    expect(limited.quota).toBeUndefined()
  })

  it('serves cached results without using the per-client limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      String(input).endsWith('/api/web_search')
        ? Response.json({ results: [{ title: 'React Dev', url: 'https://example.com/jobs/1', content: 'React job' }] })
        : Response.json({ message: { content: JSON.stringify({ jobs: [job()] }) } }),
    )
    const statuses = []
    for (let index = 0; index < 6; index += 1) statuses.push((await post({ jobs: {} }, 'open-sesame', 'jobs-cached')).status)
    expect(statuses).toEqual([200, 200, 200, 200, 200, 200])
  })

  it('retries HR lookups that found nothing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ results: [] }))
    expect(await (await post({ hrEmail: { company: 'Nobody' } }, 'open-sesame')).json()).toEqual({ email: '', source: '' })
    await post({ hrEmail: { company: 'Nobody' } }, 'open-sesame')
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('rate-limits job searches per client', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ results: [] }))
    const statuses = []
    for (let index = 0; index < 5; index += 1) statuses.push((await post({ jobs: {} }, 'open-sesame', 'jobs-limit')).status)
    expect(statuses).toEqual([200, 200, 200, 200, 429])
    const limited = await (await post({ jobs: {} }, 'open-sesame', 'jobs-limit')).json()
    expect(limited.retryAfter).toBeGreaterThan(500)
  })
})

describe('job feedback helpers', () => {
  it('parses feedback lists', () => {
    expect(parsePreferences(undefined)).toEqual([])
    expect(parsePreferences([' a  b ', 'a b', ''])).toEqual(['a b'])
    expect(parsePreferences('a')).toBeNull()
  })

  it('keeps only skipped entries with a title and reason', () => {
    expect(sanitizeSkipped({ skipped: [{ title: 'A', reason: 'r' }, { title: 'B' }, null] })).toEqual([{ title: 'A', company: '', reason: 'r' }])
    expect(sanitizeSkipped(null)).toEqual([])
  })

  it('parses applied lists', () => {
    expect(parseAppliedJobs(undefined)).toEqual([])
    expect(parseAppliedJobs([{ company: 'A', title: 'B', url: 'C', extra: 1 }])).toEqual([{ company: 'A', title: 'B', url: 'C' }])
    expect(parseAppliedJobs([{ company: 'A', title: 1, url: 'C' }])).toBeNull()
    // Long text (e.g. from a CSV import) is cut to size, not rejected.
    expect(parseAppliedJobs([{ company: 'A'.repeat(200), title: 'T'.repeat(300), url: 'u' }])).toEqual([
      { company: 'A'.repeat(80), title: 'T'.repeat(120), url: 'u' },
    ])
  })

  it('mentions applied jobs left out in the reply', () => {
    const text = describeJobResult({ query: '', queries: [], searchedAt: '', jobs: [], applied: 2 })
    expect(text).toContain("Left out 2 you've already applied to.")
  })

  it('mentions feedback and skipped jobs in the reply', () => {
    const base = { query: '', queries: [], searchedAt: '', jobs: [] }
    expect(describeJobResult(base)).toBe('No matching job openings found right now.')
    const text = describeJobResult({
      ...base,
      preferences: ['x'],
      skipped: [{ title: 'Staff Engineer', company: 'Big', reason: 'above experience' }],
    })
    expect(text).toContain('Used 1 feedback note')
    expect(text).toContain('Skipped 1 based on your "Not a fit" feedback: Staff Engineer at Big (above experience).')
  })
})

describe('cover letter email', () => {
  const target = { title: 'React Developer', company: 'Acme', url: 'https://example.com/jobs/1', email: '' }

  it('splits the subject and strips markdown', () => {
    const letter = 'Subject: Application for React Developer\n\nDear **Hiring Team**,\n\n## Why me\nI build _fast_ UIs.\n\nBest regards,\nArun N'
    expect(parseCoverLetter(letter, target)).toEqual({
      subject: 'Application for React Developer',
      body: 'Dear Hiring Team,\n\nWhy me\nI build fast UIs.\n\nBest regards,\nArun N',
    })
    expect(parseCoverLetter('Dear team,', target).subject).toBe('Application for React Developer at Acme — Arun N')
  })

  it('appends the contact signature without repeating the name', () => {
    const { body } = composeCoverLetterEmail('Subject: Hi\n\nDear team,\n\nBest regards,\nArun N', target)
    expect(body.match(/Arun N/g)).toHaveLength(1)
    expect(body).toContain('linkedin.com/in/arun-narangali')
    expect(body).toContain('Portfolio: https://arunnarangali.github.io/arun-n-dev/')
    expect(body).toContain('Resume: https://arunnarangali.github.io/arun-n-dev/ArunCV.pdf')
  })

  it('builds a Gmail compose URL for the owner account', () => {
    const url = new URL(buildGmailComposeUrl({ from: 'me@gmail.com', to: '', subject: 'Hi & bye', body: 'Line 1\nLine 2' }))
    expect(url.origin + url.pathname).toBe('https://mail.google.com/mail/u/me%40gmail.com/')
    expect(Object.fromEntries(url.searchParams)).toEqual({ view: 'cm', fs: '1', to: '', su: 'Hi & bye', body: 'Line 1\nLine 2' })
  })
})

describe('pickHrEmail', () => {
  it('prefers HR-like addresses on the company domain and skips junk', () => {
    const results = [
      { url: 'https://www.acme.com/careers', content: 'Write to noreply@acme.com or info@acme.com. Apply: careers@acme.com.' },
      { url: 'https://blog.example/post', content: 'hr@example.com logo@2x.png someone@gmail.com' },
    ]
    expect(pickHrEmail(results, 'Acme')).toEqual({ email: 'careers@acme.com', source: 'acme.com' })
  })

  it('does not treat names containing "hr" as HR addresses', () => {
    const results = [{ url: 'https://acme.com/team', content: 'chris@acme.com and careers@acmegroup.in' }]
    expect(pickHrEmail(results, 'Acme').email).toBe('careers@acmegroup.in')
  })

  it('returns nothing for weak matches', () => {
    expect(pickHrEmail([{ url: 'https://x.dev', content: 'contact info@other.io' }], 'Acme')).toEqual({ email: '', source: '' })
  })
})

describe('pageMentionsDate', () => {
  it('accepts common written forms of the date', () => {
    expect(pageMentionsDate('Published: 2026-10-12', '2026-10-12')).toBe(true)
    expect(pageMentionsDate('Posted Oct 12, 2026 in Bengaluru', '2026-10-12')).toBe(true)
    expect(pageMentionsDate('posted on 12th October, 2026', '2026-10-12')).toBe(true)
    expect(pageMentionsDate('Date posted: 12/10/2026', '2026-10-12')).toBe(true)
  })

  it('rejects dates the page does not state', () => {
    expect(pageMentionsDate('Posted 3 days ago', '2026-10-12')).toBe(false)
    expect(pageMentionsDate('Posted Oct 13, 2026', '2026-10-12')).toBe(false)
    expect(pageMentionsDate('2026-10-12', 'not a date')).toBe(false)
    expect(pageMentionsDate('Posted 12 October 2026', '2026-10-02')).toBe(false)
    expect(pageMentionsDate('Posted 21 March 2026', '2026-03-01')).toBe(false)
  })
})
