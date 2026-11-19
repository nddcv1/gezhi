import { describe, expect, it } from 'vitest'
import { mergeItems } from './merge'
import { defaultPrefs } from './prefs'
import { makeItem, makeItems } from '../test/fixtures'

describe('mergeItems', () => {
  it('returns builtin items by default', () => {
    const builtin = makeItems()
    expect(mergeItems(builtin, defaultPrefs())).toEqual(builtin)
  })

  it('filters removed builtin items', () => {
    const builtin = makeItems()
    const prefs = { ...defaultPrefs(), removedIds: ['math-0'] }
    const result = mergeItems(builtin, prefs)
    expect(result).toHaveLength(11)
    expect(result.find(i => i.id === 'math-0')).toBeUndefined()
  })

  it('appends user-added items', () => {
    const builtin = makeItems()
    const added = makeItem({ id: 'user-1', subject: 'math', title: '用户添加' })
    const prefs = { ...defaultPrefs(), addedItems: [added] }
    expect(mergeItems(builtin, prefs).at(-1)).toEqual(added)
  })

  it('prefers the user-added copy on id conflict', () => {
    const builtin = [makeItem({ id: 'dup', subject: 'math', title: '内置' })]
    const added = makeItem({ id: 'dup', subject: 'math', title: '用户' })
    const prefs = { ...defaultPrefs(), addedItems: [added] }
    const result = mergeItems(builtin, prefs)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('用户')
  })
})
