import { describe, expect, it } from 'vitest'
import { analyzeJobFit, formatJobFitReport, sampleJobDescription } from './jobFit'

describe('analyzeJobFit', () => {
  it('scores the sample job description', () => {
    const result = analyzeJobFit(sampleJobDescription)
    expect(result.matched).toEqual(expect.arrayContaining(['React.js', 'TypeScript', 'Golang', 'Kafka', 'Redux']))
    expect(result.missing).toEqual(expect.arrayContaining(['Docker', 'Kubernetes', 'GraphQL', 'Jest']))
    expect(result.score).toBeGreaterThan(50)
    expect(result.score).toBeLessThan(100)
  })

  it('maps aliases to canonical skills', () => {
    const result = analyzeJobFit('reactjs, ts, nodejs, tailwind, a11y')
    expect(result.matched).toEqual(
      expect.arrayContaining(['React.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Accessibility Auditing']),
    )
  })

  it('ignores everyday words that look like tech terms', () => {
    const result = analyzeJobFit('Ready to go and help the rest of the team')
    expect(result.matched).toEqual([])
    expect(result.missing).toEqual([])
    expect(result.score).toBe(0)
  })

  it('links matched skills to portfolio files', () => {
    const result = analyzeJobFit('kafka')
    const fileNames = result.hits.flatMap((hit) => hit.groups.map((group) => group.fileName))
    expect(fileNames).toEqual(expect.arrayContaining(['Projects.tsx', 'Skills.tsx', 'Experience.tsx']))
  })

  it('returns a helpful report for empty input', () => {
    expect(formatJobFitReport(analyzeJobFit(''))).toEqual([
      'No recognizable skills found. Paste a job description with tech requirements.',
    ])
  })
})
