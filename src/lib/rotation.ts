import type { Prefs, Question, SubjectId, VideoItem } from './types'

export const EPOCH_UTC = Date.UTC(2026, 0, 1)
const DAY_MS = 86_400_000

export function daySeed(date: Date): number {
  const localMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((localMidnight - EPOCH_UTC) / DAY_MS)
}

export function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function noTriples<T>(items: readonly T[], key: (t: T) => string): T[] {
  const remaining = [...items]
  const out: T[] = []
  while (remaining.length > 0) {
    let pick = 0
    const n = out.length
    if (n >= 2 && key(out[n - 1]) === key(out[n - 2])) {
      const k = remaining.findIndex(t => key(t) !== key(out[n - 1]))
      if (k >= 0) pick = k
    }
    out.push(remaining.splice(pick, 1)[0])
  }
  return out
}

export function preferredSubjects(items: readonly VideoItem[], prefs: Prefs): Set<SubjectId> {
  const marked = new Set<string>([...prefs.bookmarks, ...prefs.watched.map(w => w.id)])
  return new Set(items.filter(i => marked.has(i.id)).map(i => i.subject))
}

export function dailyFeed(items: readonly VideoItem[], prefs: Prefs, date: Date): VideoItem[] {
  const shuffled = seededShuffle(items, mulberry32(daySeed(date)))
  const preferred = preferredSubjects(items, prefs)
  const promoted: VideoItem[] = []
  const others: VideoItem[] = []
  for (const item of shuffled) {
    if (preferred.has(item.subject)) promoted.push(item)
    else others.push(item)
  }
  const half = Math.ceil(shuffled.length / 2)
  const result: VideoItem[] = []
  let p = 0
  let o = 0
  for (let idx = 0; idx < shuffled.length; idx++) {
    if (idx < half && p < promoted.length) result.push(promoted[p++])
    else if (o < others.length) result.push(others[o++])
    else result.push(promoted[p++])
  }
  return noTriples(result, i => i.subject)
}

export function dailyCourse(items: readonly VideoItem[], prefs: Prefs, date: Date): VideoItem | null {
  return dailyFeed(items, prefs, date)[0] ?? null
}

export function dailyQuestion(questions: readonly Question[], date: Date): Question {
  const seed = daySeed(date)
  const idx = ((seed % questions.length) + questions.length) % questions.length
  return questions[idx]
}
