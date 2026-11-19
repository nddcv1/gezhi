import { describe, expect, it } from 'vitest'
import {
  dailyCourse, dailyFeed, dailyQuestion, daySeed, mulberry32, noTriples, preferredSubjects, seededShuffle,
} from './rotation'
import type { Prefs } from './types'
import { defaultPrefs } from './prefs'
import { builtinItems } from '../data'
import { makeItems, sampleQuestions } from '../test/fixtures'

const dateA = new Date(2026, 10, 19)
const dateB = new Date(2026, 10, 20)

const sweepDate = (day: number) => new Date(2026, 0, 1 + day)

const mathIds = builtinItems.filter(item => item.subject === 'math').map(item => item.id)
const physicsIds = builtinItems.filter(item => item.subject === 'physics').map(item => item.id)
const csIds = builtinItems.filter(item => item.subject === 'cs').map(item => item.id)

function tripleViolations(prefs: Prefs): string[] {
  const bad: string[] = []
  for (let day = 0; day < 365; day++) {
    const feed = dailyFeed(builtinItems, prefs, sweepDate(day))
    if (feed.length !== builtinItems.length) {
      bad.push(`day ${day}: feed length ${feed.length}`)
      continue
    }
    for (let i = 2; i < feed.length; i++) {
      if (feed[i].subject === feed[i - 1].subject && feed[i].subject === feed[i - 2].subject) {
        bad.push(`day ${day}: triple ${feed[i].subject} ending at index ${i}`)
      }
    }
  }
  return bad
}

function promotionViolations(prefs: Prefs, subjects: ReadonlySet<string>): string[] {
  const bad: string[] = []
  for (let day = 0; day < 365; day++) {
    const feed = dailyFeed(builtinItems, prefs, sweepDate(day))
    const half = Math.ceil(feed.length / 2)
    for (let i = half; i < feed.length; i++) {
      if (subjects.has(feed[i].subject)) {
        bad.push(`day ${day}: ${feed[i].subject} at index ${i} (half ${half})`)
      }
    }
  }
  return bad
}

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

  it('avoids a late run when a valid ordering exists', () => {
    const items = ['a', 'b', 'a', 'b', 'c', 'c', 'c']
    const out = noTriples(items, x => x)
    expect([...out].sort()).toEqual([...items].sort())
    for (let i = 2; i < out.length; i++) {
      expect(out[i] === out[i - 1] && out[i] === out[i - 2]).toBe(false)
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

describe('365-day sweep on the built-in corpus', () => {
  const mathOnly: Prefs = { ...defaultPrefs(), bookmarks: mathIds }
  const mathPhysicsCs: Prefs = {
    ...defaultPrefs(),
    bookmarks: [...mathIds, ...physicsIds, ...csIds],
  }

  it('keeps runs at most two with default prefs', () => {
    expect(tripleViolations(defaultPrefs())).toEqual([])
  })

  it('keeps runs at most two with math bookmarked', () => {
    expect(tripleViolations(mathOnly)).toEqual([])
  })

  it('keeps runs at most two with math+physics+cs bookmarked', () => {
    expect(tripleViolations(mathPhysicsCs)).toEqual([])
  })

  it('promotes every math item into the first half', () => {
    expect(promotionViolations(mathOnly, new Set(['math']))).toEqual([])
  })

  it('promotes every preferred item at the exact-half boundary', () => {
    expect(promotionViolations(mathPhysicsCs, new Set(['math', 'physics', 'cs']))).toEqual([])
  })

  it('is deterministic and date-sensitive on the built-in corpus', () => {
    const first = dailyFeed(builtinItems, mathPhysicsCs, dateA).map(i => i.id)
    expect(dailyFeed(builtinItems, mathPhysicsCs, dateA).map(i => i.id)).toEqual(first)
    expect(dailyFeed(builtinItems, mathPhysicsCs, dateB).map(i => i.id)).not.toEqual(first)
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
