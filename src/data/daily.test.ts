import { describe, expect, it } from 'vitest'
import { questions } from './index'

describe('daily questions', () => {
  it('has exactly 30 questions', () => {
    expect(questions).toHaveLength(30)
  })

  it('has unique ids and non-empty text', () => {
    expect(new Set(questions.map(q => q.id)).size).toBe(30)
    for (const q of questions) {
      expect(q.question.trim().length).toBeGreaterThan(0)
      expect(q.question.length).toBeLessThanOrEqual(120)
      expect(q.answer.trim().length).toBeGreaterThan(0)
    }
  })

  it('meets subject quotas', () => {
    const count = (s: string) => questions.filter(q => q.subject === s).length
    expect(count('math')).toBe(15)
    expect(count('physics')).toBe(6)
    expect(count('philosophy')).toBe(5)
    expect(count('cs')).toBe(4)
  })
})
