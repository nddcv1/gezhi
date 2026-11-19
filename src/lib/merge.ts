import type { Prefs, VideoItem } from './types'

export function mergeItems(builtin: VideoItem[], prefs: Prefs): VideoItem[] {
  const removed = new Set(prefs.removedIds)
  const addedIds = new Set(prefs.addedItems.map(i => i.id))
  const base = builtin.filter(i => !removed.has(i.id) && !addedIds.has(i.id))
  return [...base, ...prefs.addedItems]
}
