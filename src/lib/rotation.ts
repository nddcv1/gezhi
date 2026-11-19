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

// Groups items into per-key queues, preserving each key's input order. Map
// insertion order records the first appearance of every key, which is the
// deterministic tie-breaker used below.
function buildQueues<T>(items: readonly T[], key: (t: T) => string): Map<string, T[]> {
  const queues = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const bucket = queues.get(k)
    if (bucket) bucket.push(item)
    else queues.set(k, [item])
  }
  return queues
}

// Picks the allowed key with the most items left that is not the blocked key.
// Ties go to the key whose first appearance in the input comes first, thanks
// to Map insertion order and the strict comparison. Returns null when no
// allowed unblocked key has items left.
function pickLargest<T>(
  queues: Map<string, T[]>,
  blocked: string | null,
  allowed?: (key: string) => boolean,
): string | null {
  let best: string | null = null
  let bestCount = 0
  for (const [k, bucket] of queues) {
    if (bucket.length === 0 || k === blocked) continue
    if (allowed && !allowed(k)) continue
    if (bucket.length > bestCount) {
      best = k
      bestCount = bucket.length
    }
  }
  return best
}

// Deterministic fallback for infeasible inputs: append every remaining queue
// in insertion order, keeping each queue's input order.
function drainRemaining<T>(queues: Map<string, T[]>, out: T[]): void {
  for (const bucket of queues.values()) {
    while (bucket.length > 0) out.push(bucket.shift() as T)
  }
}

export function noTriples<T>(items: readonly T[], key: (t: T) => string): T[] {
  const queues = buildQueues(items, key)
  const out: T[] = []
  while (out.length < items.length) {
    const n = out.length
    const blocked = n >= 2 && key(out[n - 1]) === key(out[n - 2]) ? key(out[n - 1]) : null
    const chosen = pickLargest(queues, blocked)
    if (chosen === null) {
      // Infeasible input: only items sharing the blocked key remain, so a
      // final run of three is unavoidable; keep every item deterministically.
      drainRemaining(queues, out)
      break
    }
    out.push(queues.get(chosen)!.shift() as T)
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
  const queues = buildQueues(shuffled, item => item.subject)
  const half = Math.ceil(shuffled.length / 2)
  const out: VideoItem[] = []
  while (out.length < shuffled.length) {
    const n = out.length
    const blocked = n >= 2 && out[n - 1].subject === out[n - 2].subject ? out[n - 1].subject : null
    let chosen: string | null
    if (n < half) {
      // First half: take preferred subjects whenever one is available and not
      // blocked; a non-preferred subject is only a spacer when every remaining
      // preferred key is blocked.
      chosen = pickLargest(queues, blocked, k => preferred.has(k as SubjectId))
      if (chosen === null) chosen = pickLargest(queues, blocked)
    } else {
      chosen = pickLargest(queues, blocked)
    }
    if (chosen === null) {
      // Infeasible input (only blocked-key items remain): append the rest in
      // deterministic order so no item is lost.
      drainRemaining(queues, out)
      break
    }
    out.push(queues.get(chosen)!.shift() as VideoItem)
  }
  return out
}

export function dailyCourse(items: readonly VideoItem[], prefs: Prefs, date: Date): VideoItem | null {
  return dailyFeed(items, prefs, date)[0] ?? null
}

export function dailyQuestion(questions: readonly Question[], date: Date): Question {
  const seed = daySeed(date)
  const idx = ((seed % questions.length) + questions.length) % questions.length
  return questions[idx]
}
