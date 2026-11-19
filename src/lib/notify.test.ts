import { describe, expect, it } from 'vitest'
import { next30Days, notificationId } from './notify'

describe('next30Days', () => {
  it('starts today when the time has not passed yet', () => {
    const dates = next30Days('20:00', new Date(2026, 10, 19, 10, 0))
    expect(dates).toHaveLength(30)
    expect(dates[0]).toEqual(new Date(2026, 10, 19, 20, 0))
    expect(dates[29]).toEqual(new Date(2026, 11, 18, 20, 0))
  })

  it('starts tomorrow when the time already passed', () => {
    const dates = next30Days('09:00', new Date(2026, 10, 19, 10, 0))
    expect(dates[0]).toEqual(new Date(2026, 10, 20, 9, 0))
  })

  it('keeps every entry at the exact hour and minute', () => {
    for (const d of next30Days('07:05', new Date(2026, 10, 19, 6, 0))) {
      expect(d.getHours()).toBe(7)
      expect(d.getMinutes()).toBe(5)
    }
  })
})

describe('notificationId', () => {
  it('is stable per day and unique across days', () => {
    const a = notificationId(new Date(2026, 10, 19))
    const b = notificationId(new Date(2026, 10, 20))
    expect(a).toBe(20261119)
    expect(a).not.toBe(b)
  })
})
