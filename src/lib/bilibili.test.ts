import { describe, expect, it, vi } from 'vitest'
import { enrichItem, isFresh, META_TTL_MS, parseViewResponse, serialOnce, type MetaFetcher } from './bilibili'

const now = 1_700_000_000_000

const validPayload = {
  code: 0,
  data: { title: '  数学分析 第一讲  ', duration: 3600, stat: { view: 123456 } },
}

describe('isFresh', () => {
  it('is fresh within 24h and stale after', () => {
    expect(isFresh({ fetchedAt: now - META_TTL_MS + 1 }, now)).toBe(true)
    expect(isFresh({ fetchedAt: now - META_TTL_MS }, now)).toBe(false)
    expect(isFresh(undefined, now)).toBe(false)
  })
})

describe('parseViewResponse', () => {
  it('extracts title, view and duration', () => {
    expect(parseViewResponse(validPayload, now)).toEqual({
      fetchedAt: now,
      title: '数学分析 第一讲',
      view: 123456,
      duration: 3600,
    })
  })
  it('returns null for error responses', () => {
    expect(parseViewResponse({ code: -404, message: '啥都木有' }, now)).toBeNull()
    expect(parseViewResponse({ code: 0, data: {} }, now)).toBeNull()
    expect(parseViewResponse('nope', now)).toBeNull()
  })
})

describe('enrichItem', () => {
  it('returns parsed metadata on success', async () => {
    const fetcher: MetaFetcher = vi.fn(async () => ({ status: 200, data: validPayload }))
    const entry = await enrichItem('BV1xx411c7mD', { fetcher, now: () => now })
    expect(entry?.title).toBe('数学分析 第一讲')
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it('returns null on HTTP failure or thrown errors', async () => {
    const failing: MetaFetcher = vi.fn(async () => ({ status: 500, data: null }))
    expect(await enrichItem('BV1xx411c7mD', { fetcher: failing, now: () => now })).toBeNull()
    const throwing: MetaFetcher = vi.fn(async () => { throw new Error('network') })
    expect(await enrichItem('BV1xx411c7mD', { fetcher: throwing, now: () => now })).toBeNull()
  })
})

describe('serialOnce', () => {
  it('keeps calls in order', async () => {
    const order: number[] = []
    const tasks = [0, 1, 2].map(n =>
      serialOnce(async () => {
        order.push(n)
        return n
      }, 0),
    )
    await Promise.all(tasks)
    expect(order).toEqual([0, 1, 2])
  })
})
