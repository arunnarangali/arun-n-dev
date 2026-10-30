import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanRewrite, cleanSuggestion, endsWithQuestion, parseEnhanceText, parseSuggestTurns, VISITOR_DAILY_LIMIT } from './promptTools'
import { handleChatRequest } from '../../../worker/chat'

describe('endsWithQuestion', () => {
  it('spots a question at the end, even wrapped in markdown or emoji', () => {
    expect(endsWithQuestion('Here are two options.\n\nWhich one do you prefer?')).toBe(true)
    expect(endsWithQuestion('Done.\n\n**Want me to draft the cover letter?**')).toBe(true)
    expect(endsWithQuestion('Sure thing. Shall I continue? 🙂')).toBe(true)
    expect(endsWithQuestion('Should I use `React`?`')).toBe(true)
  })

  it('ignores questions earlier in the answer, inside code, or in tables', () => {
    expect(endsWithQuestion('Why React? Because it is popular.\n\nThat is all.')).toBe(false)
    expect(endsWithQuestion('Example:\n```js\nconst ok = a ? b : c?\n```')).toBe(false)
    expect(endsWithQuestion('| Question | Answer |\n| Why? | Because? |')).toBe(false)
    expect(endsWithQuestion('')).toBe(false)
  })
})

describe('cleanRewrite', () => {
  const original = 'this is my https://github.com/arunnarangali acount, give recnt project'

  it('strips prefaces, quotes and fences', () => {
    expect(cleanRewrite('wat is it', 'Here is the rewritten message: "What is it?"')).toEqual({ text: 'What is it?', changed: true })
    expect(cleanRewrite('wat is it', '```\nWhat is it?\n```')).toEqual({ text: 'What is it?', changed: true })
    expect(cleanRewrite('What is it?', 'What is it?')).toEqual({ text: 'What is it?', changed: false })
  })

  it('keeps the original when the rewrite drops a URL, is empty or balloons', () => {
    expect(cleanRewrite(original, 'This is my GitHub account. Show my recent project.')).toEqual({ text: original, changed: false })
    expect(cleanRewrite(original, '   ')).toEqual({ text: original, changed: false })
    expect(cleanRewrite('hi there', 'x'.repeat(500))).toEqual({ text: 'hi there', changed: false })
    expect(cleanRewrite(original, 'This is my https://github.com/arunnarangali account. Show my most recent project.').changed).toBe(true)
  })
})

describe('cleanSuggestion', () => {
  it('keeps one short line and drops echoes of the question', () => {
    expect(cleanSuggestion('Reply: "Yes, the frontend role please"\nExtra line')).toBe('Yes, the frontend role please')
    expect(cleanSuggestion('x'.repeat(200))).toBe('')
    expect(cleanSuggestion('Which one do you prefer?', 'Which one do you prefer?')).toBe('')
  })
})

describe('request parsing', () => {
  it('validates ✨ text and suggestion turns', () => {
    expect(parseEnhanceText('  fix ths  ')).toBe('fix ths')
    expect(parseEnhanceText('/jobs react')).toBeNull()
    expect(parseEnhanceText('hi')).toBeNull()
    expect(parseSuggestTurns([{ role: 'user', content: 'hi' }])).toBeNull()
    const turns = parseSuggestTurns([{ role: 'user', content: 'hi' }, { role: 'assistant', content: `${'a'.repeat(900)}Which?` }])
    expect(turns?.at(-1)?.content.endsWith('Which?')).toBe(true)
    expect(turns?.at(-1)?.content.length).toBeLessThanOrEqual(601)
  })
})

describe('worker prompt tools', () => {
  const env = { OLLAMA_API_KEY: 'test-key', OWNER_PASSCODE: 'open-sesame' }
  let client = 0
  const post = (body: unknown, { passcode, clientId = `tools-${(client += 1)}` }: { passcode?: string; clientId?: string } = {}) =>
    handleChatRequest(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: passcode ? { 'Content-Type': 'application/json', 'X-Owner-Passcode': passcode } : { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      env,
      clientId,
    )
  const modelReplies = (content: string) => {
    const sent: { system: string; user: string }[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const { messages } = JSON.parse(String(init?.body))
      sent.push({ system: messages[0].content, user: messages[1].content })
      return Response.json({ message: { content } })
    })
    return sent
  }

  afterEach(() => vi.restoreAllMocks())

  it('improves a message, sending the text only as the user turn', async () => {
    const sent = modelReplies('What projects did you build with React?')
    const response = await post({ enhance: { text: 'wat projects did u bulid wiht react' } })
    expect(await response.json()).toEqual({ text: 'What projects did you build with React?', changed: true, remaining: VISITOR_DAILY_LIMIT - 1 })
    expect(sent[0].user).toBe('wat projects did u bulid wiht react')
    expect(sent[0].system).not.toContain('wat projects')
  })

  it('gives visitors 3 a day, without counting blocked tries or failures', async () => {
    modelReplies('Fixed text.')
    const statuses: number[] = []
    for (let attempt = 0; attempt < 5; attempt += 1)
      statuses.push((await post({ enhance: { text: 'fix ths text' } }, { clientId: 'visitor-a' })).status)
    expect(statuses).toEqual([200, 200, 200, 429, 429])
    const limited = await (await post({ enhance: { text: 'fix ths text' } }, { clientId: 'visitor-a' })).json()
    expect(limited).toMatchObject({ remaining: 0, error: expect.stringContaining('Daily limit') })
    expect(limited.retryAfter).toBeGreaterThan(23 * 60 * 60)

    vi.restoreAllMocks()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('down', { status: 500 }))
    expect((await post({ enhance: { text: 'fix ths text' } }, { clientId: 'visitor-b' })).status).toBe(502)
    vi.restoreAllMocks()
    modelReplies('Fixed text.')
    // The failed call was refunded, so all three are still left.
    expect(await (await post({ enhance: { text: 'fix ths text' } }, { clientId: 'visitor-b' })).json()).toMatchObject({ remaining: 2 })
  })

  it('does not cap the owner at 3, and counts wrong passcodes as guesses', async () => {
    modelReplies('Fixed text.')
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await post({ enhance: { text: 'fix ths text' } }, { passcode: 'open-sesame', clientId: 'owner' })
      expect(response.status).toBe(200)
      expect((await response.json()).remaining).toBeUndefined()
    }
    const statuses: number[] = []
    for (let attempt = 0; attempt < 13; attempt += 1)
      statuses.push((await post({ enhance: { text: 'fix ths text' } }, { passcode: `guess-${attempt}`, clientId: 'tool-guesser' })).status)
    expect(statuses.slice(0, 12).every((status) => status === 403)).toBe(true)
    expect(statuses[12]).toBe(429)
  })

  it('suggests one short reply to the assistant question', async () => {
    const sent = modelReplies('Suggested reply: "The frontend one, please."')
    const response = await post({
      suggest: { messages: [{ role: 'user', content: 'find me jobs' }, { role: 'assistant', content: 'I found two roles. Which one should I draft a letter for?' }] },
    })
    expect(await response.json()).toMatchObject({ suggestion: 'The frontend one, please.' })
    expect(sent[0].user).toContain('Assistant: I found two roles.')
    expect((await post({ suggest: { messages: [{ role: 'user', content: 'hi' }] } })).status).toBe(400)
  })
})
