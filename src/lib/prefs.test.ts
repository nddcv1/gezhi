import { describe, expect, it } from 'vitest'
import { defaultPrefs, validatePrefs } from './prefs'

describe('validatePrefs', () => {
  it('returns defaults for garbage input', () => {
    expect(validatePrefs('not an object')).toEqual(defaultPrefs())
    expect(validatePrefs(null)).toEqual(defaultPrefs())
    expect(validatePrefs(42)).toEqual(defaultPrefs())
  })

  it('keeps valid fields and fills missing settings', () => {
    const prefs = validatePrefs({
      bookmarks: ['a', 3, 'b'],
      settings: { notifyTime: '07:30', enrichEnabled: false },
    })
    expect(prefs.bookmarks).toEqual(['a', 'b'])
    expect(prefs.settings.notifyTime).toBe('07:30')
    expect(prefs.settings.enrichEnabled).toBe(false)
    expect(prefs.settings.notifyEnabled).toBe(true)
  })

  it('drops invalid notifyTime', () => {
    expect(validatePrefs({ settings: { notifyTime: '25:99' } }).settings.notifyTime).toBe('20:00')
    expect(validatePrefs({ settings: { notifyTime: '' } }).settings.notifyTime).toBe('20:00')
  })

  it('limits watched to 100 newest entries and drops invalid ones', () => {
    const watched = Array.from({ length: 120 }, (_, i) => ({ id: `w${i}`, at: i }))
    const prefs = validatePrefs({ watched: [...watched, { id: 'bad' }, null] })
    expect(prefs.watched).toHaveLength(100)
    expect(prefs.watched[0].id).toBe('w0')
  })

  it('sanitizes metaCache entries', () => {
    const prefs = validatePrefs({
      metaCache: {
        BV1xx411c7mD: { fetchedAt: 1000, title: 't', view: 5, duration: 60 },
        broken: { title: 'no timestamp' },
        alsoBroken: 'x',
      },
    })
    expect(prefs.metaCache.BV1xx411c7mD).toEqual({ fetchedAt: 1000, title: 't', view: 5, duration: 60 })
    expect(prefs.metaCache.broken).toBeUndefined()
    expect(prefs.metaCache.alsoBroken).toBeUndefined()
  })

  it('drops malformed added items but keeps valid ones', () => {
    const prefs = validatePrefs({
      addedItems: [
        { id: 'x1', title: 't', upName: 'u', subject: 'math', level: '入门', tags: [], description: 'd', url: 'https://example.com' },
        { id: 'x2', title: 't', subject: 'nope', level: '入门' },
        { title: 'no id' },
      ],
    })
    expect(prefs.addedItems.map(i => i.id)).toEqual(['x1'])
  })
})
