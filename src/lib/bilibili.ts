import { Capacitor, CapacitorHttp } from '@capacitor/core'
import type { MetaCacheEntry, Prefs } from './types'

export const META_TTL_MS = 24 * 60 * 60 * 1000

const UA =
  'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'

export interface MetaRequest {
  url: string
  headers: Record<string, string>
}

export type MetaFetcher = (req: MetaRequest) => Promise<{ status: number; data: unknown }>

export interface EnrichDeps {
  fetcher: MetaFetcher
  now: () => number
}

export function isFresh(entry: MetaCacheEntry | undefined, now: number): boolean {
  return !!entry && now - entry.fetchedAt < META_TTL_MS
}

export function parseViewResponse(data: unknown, now: number): MetaCacheEntry | null {
  if (typeof data !== 'object' || data === null) return null
  const payload = data as { code?: unknown; data?: { title?: unknown; duration?: unknown; stat?: { view?: unknown } } }
  if (payload.code !== 0 || typeof payload.data !== 'object' || payload.data === null) return null
  const title = typeof payload.data.title === 'string' && payload.data.title.trim() ? payload.data.title.trim() : undefined
  const duration = typeof payload.data.duration === 'number' && payload.data.duration > 0 ? payload.data.duration : undefined
  const view = typeof payload.data.stat?.view === 'number' ? payload.data.stat.view : undefined
  if (title === undefined && duration === undefined && view === undefined) return null
  const entry: MetaCacheEntry = { fetchedAt: now }
  if (title !== undefined) entry.title = title
  if (view !== undefined) entry.view = view
  if (duration !== undefined) entry.duration = duration
  return entry
}

export async function enrichItem(bvid: string, deps: EnrichDeps): Promise<MetaCacheEntry | null> {
  try {
    const res = await deps.fetcher({
      url: `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
      headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
    })
    if (res.status !== 200) return null
    return parseViewResponse(res.data, deps.now())
  } catch {
    return null
  }
}

export function nativeFetcher(): MetaFetcher {
  return async ({ url, headers }) => {
    const res = await CapacitorHttp.get({ url, headers, connectTimeout: 8000, readTimeout: 8000 })
    return { status: res.status, data: res.data }
  }
}

export function canEnrich(prefs: Prefs): boolean {
  return prefs.settings.enrichEnabled && Capacitor.isNativePlatform()
}

let chain: Promise<void> = Promise.resolve()
let lastAt = 0

export function serialOnce<T>(fn: () => Promise<T>, gapMs = 1000): Promise<T> {
  const run = chain.then(async () => {
    const wait = Math.max(0, lastAt + gapMs - Date.now())
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait))
    try {
      return await fn()
    } finally {
      lastAt = Date.now()
    }
  })
  chain = run.then(() => undefined, () => undefined)
  return run
}
