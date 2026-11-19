import { Preferences } from '@capacitor/preferences'
import type { Level, MetaCacheEntry, Prefs, SubjectId, VideoItem, WatchedEntry } from './types'

export const PREFS_KEY = 'gezhi.prefs.v1'

const SUBJECT_IDS: SubjectId[] = ['math', 'physics', 'cs', 'econ', 'philosophy', 'humanities']
const LEVELS: Level[] = ['入门', '进阶', '硬核']
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function defaultPrefs(): Prefs {
  return {
    version: 1,
    addedItems: [],
    removedIds: [],
    bookmarks: [],
    watched: [],
    settings: { enrichEnabled: true, notifyEnabled: true, notifyTime: '20:00' },
    onboarded: false,
    metaCache: {},
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isVideoItem(v: unknown): v is VideoItem {
  if (!isRecord(v)) return false
  return (
    typeof v.id === 'string' && v.id.length > 0 &&
    typeof v.title === 'string' && v.title.length > 0 &&
    typeof v.upName === 'string' &&
    SUBJECT_IDS.includes(v.subject as SubjectId) &&
    LEVELS.includes(v.level as Level) &&
    Array.isArray(v.tags) && v.tags.every(t => typeof t === 'string') &&
    typeof v.description === 'string' &&
    (typeof v.bvid === 'string' || typeof v.url === 'string') &&
    (v.bvid === undefined || /^BV[0-9A-Za-z]{10}$/.test(v.bvid as string))
  )
}

function isWatched(v: unknown): v is WatchedEntry {
  return isRecord(v) && typeof v.id === 'string' && typeof v.at === 'number'
}

function sanitizeMeta(raw: unknown): Record<string, MetaCacheEntry> {
  if (!isRecord(raw)) return {}
  const out: Record<string, MetaCacheEntry> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value) || typeof value.fetchedAt !== 'number') continue
    const entry: MetaCacheEntry = { fetchedAt: value.fetchedAt }
    if (typeof value.title === 'string') entry.title = value.title
    if (typeof value.view === 'number') entry.view = value.view
    if (typeof value.duration === 'number') entry.duration = value.duration
    out[key] = entry
  }
  return out
}

export function validatePrefs(raw: unknown): Prefs {
  const d = defaultPrefs()
  if (!isRecord(raw)) return d
  const settings = isRecord(raw.settings) ? raw.settings : {}
  return {
    version: 1,
    addedItems: Array.isArray(raw.addedItems) ? raw.addedItems.filter(isVideoItem) : [],
    removedIds: Array.isArray(raw.removedIds) ? raw.removedIds.filter((x): x is string => typeof x === 'string') : [],
    bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks.filter((x): x is string => typeof x === 'string') : [],
    watched: Array.isArray(raw.watched) ? raw.watched.filter(isWatched).slice(0, 100) : [],
    settings: {
      enrichEnabled: typeof settings.enrichEnabled === 'boolean' ? settings.enrichEnabled : d.settings.enrichEnabled,
      notifyEnabled: typeof settings.notifyEnabled === 'boolean' ? settings.notifyEnabled : d.settings.notifyEnabled,
      notifyTime: typeof settings.notifyTime === 'string' && TIME_RE.test(settings.notifyTime) ? settings.notifyTime : d.settings.notifyTime,
    },
    onboarded: raw.onboarded === true,
    metaCache: sanitizeMeta(raw.metaCache),
  }
}

export async function loadPrefs(): Promise<Prefs> {
  const { value } = await Preferences.get({ key: PREFS_KEY })
  if (!value) return defaultPrefs()
  try {
    return validatePrefs(JSON.parse(value))
  } catch {
    return defaultPrefs()
  }
}

export async function savePrefs(p: Prefs): Promise<void> {
  await Preferences.set({ key: PREFS_KEY, value: JSON.stringify(p) })
}
