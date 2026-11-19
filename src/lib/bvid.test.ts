import { describe, expect, it } from 'vitest'
import { parseBvid } from './bvid'

describe('parseBvid', () => {
  it('parses a bare BV id', () => {
    expect(parseBvid('BV1xx411c7mD')).toBe('BV1xx411c7mD')
  })
  it('parses a full video URL with query params', () => {
    expect(parseBvid('https://www.bilibili.com/video/BV1xx411c7mD/?p=2&t=3')).toBe('BV1xx411c7mD')
    expect(parseBvid('m.bilibili.com/video/BV1xx411c7mD')).toBe('BV1xx411c7mD')
  })
  it('rejects invalid input', () => {
    expect(parseBvid('')).toBeNull()
    expect(parseBvid('https://example.com/abc')).toBeNull()
    expect(parseBvid('BV123')).toBeNull()
  })
})
