import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { defaultPrefs, loadPrefs, savePrefs } from './prefs'
import type { MetaCacheEntry, Prefs, VideoItem } from './types'

interface StoreValue {
  prefs: Prefs
  ready: boolean
  toggleBookmark(id: string): void
  recordWatched(id: string): void
  addItem(item: VideoItem): void
  removeItem(id: string): void
  restoreAll(): void
  updateSettings(partial: Partial<Prefs['settings']>): void
  setMeta(bvid: string, entry: MetaCacheEntry): void
  completeOnboarding(): void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children, initialPrefs }: { children: ReactNode; initialPrefs?: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs ?? defaultPrefs())
  const [ready, setReady] = useState(Boolean(initialPrefs))
  const loaded = useRef(false)
  const saveEnabled = useRef(Boolean(initialPrefs))

  useEffect(() => {
    if (loaded.current || initialPrefs) return
    loaded.current = true
    loadPrefs()
      .then(p => {
        setPrefs(p)
        saveEnabled.current = true
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [initialPrefs])

  useEffect(() => {
    if (!ready || !saveEnabled.current) return
    void savePrefs(prefs).catch(() => undefined)
  }, [prefs, ready])

  const update = useCallback((fn: (p: Prefs) => Prefs) => {
    saveEnabled.current = true
    setPrefs(fn)
  }, [])

  const value: StoreValue = {
    prefs,
    ready,
    toggleBookmark: useCallback((id: string) => update(p => ({
      ...p,
      bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter(b => b !== id) : [id, ...p.bookmarks],
    })), [update]),
    recordWatched: useCallback((id: string) => update(p => ({
      ...p,
      watched: [{ id, at: Date.now() }, ...p.watched.filter(w => w.id !== id)].slice(0, 100),
    })), [update]),
    addItem: useCallback((item: VideoItem) => update(p => ({
      ...p,
      addedItems: [item, ...p.addedItems.filter(i => i.id !== item.id)],
      removedIds: p.removedIds.filter(id => id !== item.id),
    })), [update]),
    removeItem: useCallback((id: string) => update(p => {
      const isAdded = p.addedItems.some(i => i.id === id)
      if (isAdded) return { ...p, addedItems: p.addedItems.filter(i => i.id !== id) }
      return { ...p, removedIds: p.removedIds.includes(id) ? p.removedIds : [...p.removedIds, id] }
    }), [update]),
    restoreAll: useCallback(() => update(p => ({ ...p, removedIds: [] })), [update]),
    updateSettings: useCallback((partial: Partial<Prefs['settings']>) => update(p => ({
      ...p,
      settings: { ...p.settings, ...partial },
    })), [update]),
    setMeta: useCallback((bvid: string, entry: MetaCacheEntry) => update(p => ({
      ...p,
      metaCache: { ...p.metaCache, [bvid]: entry },
    })), [update]),
    completeOnboarding: useCallback(() => update(p => ({ ...p, onboarded: true })), [update]),
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export { builtinItems, questions } from '../data'
