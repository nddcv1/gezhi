import { describe, expect, it } from 'vitest'
import { parseRoute, routeHash } from './router'

describe('parseRoute', () => {
  it('defaults to today', () => {
    expect(parseRoute('')).toEqual({ name: 'today' })
    expect(parseRoute('#/unknown')).toEqual({ name: 'today' })
  })
  it('parses static routes', () => {
    expect(parseRoute('#/subjects')).toEqual({ name: 'subjects' })
    expect(parseRoute('#/mine')).toEqual({ name: 'mine' })
    expect(parseRoute('#/add')).toEqual({ name: 'add' })
    expect(parseRoute('#/settings')).toEqual({ name: 'settings' })
  })
  it('parses subject routes and rejects invalid subjects', () => {
    expect(parseRoute('#/subject/math')).toEqual({ name: 'subject', id: 'math' })
    expect(parseRoute('#/subject/nope')).toEqual({ name: 'subjects' })
  })
  it('parses item routes with decoding', () => {
    expect(parseRoute('#/item/BV1xx411c7mD')).toEqual({ name: 'item', id: 'BV1xx411c7mD' })
    expect(parseRoute('#/item/a%20b')).toEqual({ name: 'item', id: 'a b' })
  })
  it('round-trips through routeHash', () => {
    const routes = [
      { name: 'today' as const },
      { name: 'subjects' as const },
      { name: 'subject' as const, id: 'cs' as const },
      { name: 'item' as const, id: 'user-1' },
      { name: 'mine' as const },
    ]
    for (const route of routes) {
      expect(parseRoute(routeHash(route))).toEqual(route)
    }
  })
})
