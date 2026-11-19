import type { Question, VideoItem } from '../lib/types'

export function makeItem(partial: Partial<VideoItem> & Pick<VideoItem, 'id' | 'subject'>): VideoItem {
  return {
    title: `标题-${partial.id}`,
    upName: '测试UP',
    level: '入门',
    tags: [],
    description: '测试简介',
    ...partial,
  }
}

export function makeItems(): VideoItem[] {
  const items: VideoItem[] = []
  const subjects = ['math', 'physics', 'cs'] as const
  for (const subject of subjects) {
    for (let i = 0; i < 4; i++) {
      items.push(makeItem({ id: `${subject}-${i}`, subject }))
    }
  }
  return items
}

export const sampleQuestions: Question[] = Array.from({ length: 30 }, (_, i) => ({
  id: `q${i}`,
  subject: 'math' as const,
  question: `问题${i}`,
  answer: `答案${i}`,
}))
