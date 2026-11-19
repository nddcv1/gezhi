export type SubjectId = 'math' | 'physics' | 'cs' | 'econ' | 'philosophy' | 'humanities'
export type Level = '入门' | '进阶' | '硬核'

export interface VideoItem {
  id: string
  bvid?: string
  url?: string
  title: string
  upName: string
  subject: SubjectId
  level: Level
  tags: string[]
  description: string
  curatedAt?: string
  addedAt?: number
  curated?: boolean
}

export interface Question {
  id: string
  subject: SubjectId
  question: string
  answer: string
}

export interface Settings {
  enrichEnabled: boolean
  notifyEnabled: boolean
  notifyTime: string
}

export interface WatchedEntry {
  id: string
  at: number
}

export interface MetaCacheEntry {
  fetchedAt: number
  title?: string
  view?: number
  duration?: number
}

export interface Prefs {
  version: 1
  addedItems: VideoItem[]
  removedIds: string[]
  bookmarks: string[]
  watched: WatchedEntry[]
  settings: Settings
  onboarded: boolean
  metaCache: Record<string, MetaCacheEntry>
}
