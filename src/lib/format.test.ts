import { describe, expect, it } from 'vitest'
import { formatDate, formatDuration, formatView } from './format'

describe('formatView', () => {
  it('renders raw numbers below 10k', () => {
    expect(formatView(9999)).toBe('9999')
  })
  it('renders 万 with one decimal', () => {
    expect(formatView(25400)).toBe('2.5万')
    expect(formatView(20000)).toBe('2万')
  })
  it('renders 亿 with one decimal', () => {
    expect(formatView(130000000)).toBe('1.3亿')
  })
  it('renders empty for missing values', () => {
    expect(formatView(undefined)).toBe('')
  })
})

describe('formatDuration', () => {
  it('renders mm:ss', () => {
    expect(formatDuration(95)).toBe('1:35')
  })
  it('renders h:mm:ss', () => {
    expect(formatDuration(3725)).toBe('1:02:05')
  })
  it('renders empty for missing values', () => {
    expect(formatDuration(undefined)).toBe('')
  })
})

describe('formatDate', () => {
  it('formats chinese date with weekday', () => {
    expect(formatDate(new Date(2026, 10, 19))).toBe('2026年11月19日 星期四')
  })
})
