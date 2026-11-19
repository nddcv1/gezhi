import { describe, expect, it } from 'vitest'
import {
  dailyCourse, dailyFeed, dailyQuestion, daySeed, mulberry32, noTriples, preferredSubjects, seededShuffle,
} from './rotation'
import { defaultPrefs } from './prefs'
import { makeItems, sampleQuestions } from '../test/fixtures'

const dateA = new Date(2026, 10, 19)
const dateB = new Date(2026, 10, 20)

describe('daySeed', () => {
  it('is 0 on the epoch day and increments daily', () => {
    expect(daySeed(new Date(2026, 0, 1))).toBe(0)
    expect(daySeed(new Date(2026, 0, 2))).toBe(1)
  })
})

describe('mulberry32 / seededShuffle', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('shuffles deterministically while keeping all elements', () => {
    const items = makeItems().map(i => i.id)
    const r1 = seededShuffle(items, mulberry32(7))
    const r2 = seededShuffle(items, mulberry32(7))
    expect(r1).toEqual(r2)
    expect([...r1].sort()).toEqual([...items].sort())
  })
})

describe('noTriples', () => {
  it('never leaves three equal keys in a row', () => {
    const items = ['a', 'a', 'a', 'b', 'b', 'b', 'c']
    const out = noTriples(items, x => x)
    expect([...out].sort()).toEqual([...items].sort())
    for (let i = 2; i < out.length; i++) {
      const triple = out[i] === out[i - 1] && out[i] === out[i - 2]
      expect(triple).toBe(false)
    }
  })
})

describe('preferredSubjects', () => {
  it('collects subjects of bookmarked and watched items', () => {
    const items = makeItems()
    const prefs = {
      ...defaultPrefs(),
      bookmarks: ['math-0'],
      watched: [{ id: 'physics-1', at: 1 }],
    }
    const set = preferredSubjects(items, prefs)
    expect(set.has('math')).toBe(true)
    expect(set.has('physics')).toBe(true)
    expect(set.has('cs')).toBe(false)
  })
})

describe('dailyFeed', () => {
  const items = makeItems()

  it('is deterministic for the same date and prefs', () => {
    expect(dailyFeed(items, defaultPrefs(), dateA).map(i => i.id))
      .toEqual(dailyFeed(items, defaultPrefs(), dateA).map(i => i.id))
  })

  it('changes with the date', () => {
    expect(dailyFeed(items, defaultPrefs(), dateA).map(i => i.id))
      .not.toEqual(dailyFeed(items, defaultPrefs(), dateB).map(i => i.id))
  })

  it('keeps at most two consecutive items from one subject', () => {
    const feed = dailyFeed(items, defaultPrefs(), dateA)
    for (let i = 2; i < feed.length; i++) {
      const triple = feed[i].subject === feed[i - 1].subject && feed[i].subject === feed[i - 2].subject
      expect(triple).toBe(false)
    }
  })

  it('promotes preferred subjects into the first half', () => {
    const prefs = { ...defaultPrefs(), bookmarks: ['math-0'] }
    const feed = dailyFeed(items, prefs, dateA)
    const half = Math.ceil(feed.length / 2)
    const mathPositions = feed
      .map((item, idx) => (item.subject === 'math' ? idx : -1))
      .filter(idx => idx >= 0)
    expect(mathPositions.every(idx => idx < half)).toBe(true)
  })

  it('dailyCourse returns the first feed item', () => {
    const feed = dailyFeed(items, defaultPrefs(), dateA)
    expect(dailyCourse(items, defaultPrefs(), dateA)?.id).toBe(feed[0].id)
  })
})

describe('dailyQuestion', () => {
  it('covers all 30 questions over 30 consecutive days', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 30; i++) {
      ids.add(dailyQuestion(sampleQuestions, new Date(2026, 10, 19 + i)).id)
    }
    expect(ids.size).toBe(30)
  })

  it('is deterministic for the same day', () => {
    expect(dailyQuestion(sampleQuestions, dateA).id).toBe(dailyQuestion(sampleQuestions, dateA).id)
  })
})
