import { describe, expect, it } from 'vitest'
import content from './content.json'

const items = content.items as Array<{
  id: string
  bvid?: string
  url?: string
  title: string
  upName: string
  subject: string
  level: string
  tags: string[]
  description: string
}>

const SUBJECTS = ['math', 'physics', 'cs', 'econ', 'philosophy', 'humanities']
const LEVELS = ['入门', '进阶', '硬核']

describe('content library', () => {
  it('has at least 60 items', () => {
    expect(items.length).toBeGreaterThanOrEqual(60)
  })

  it('covers every subject with at least 10 items', () => {
    for (const subject of SUBJECTS) {
      expect(items.filter(i => i.subject === subject).length).toBeGreaterThanOrEqual(10)
    }
  })

  it('uses unique ids and valid levels', () => {
    expect(new Set(items.map(i => i.id)).size).toBe(items.length)
    for (const item of items) {
      expect(LEVELS).toContain(item.level)
      expect(item.title.length).toBeGreaterThan(0)
      expect(item.upName.length).toBeGreaterThan(0)
      expect(item.description.length).toBeGreaterThan(0)
      expect(item.tags.length).toBeGreaterThan(0)
      expect(item.bvid || item.url).toBeTruthy()
      if (item.bvid) {
        expect(item.id).toBe(item.bvid.toLowerCase())
      }
    }
  })
})
