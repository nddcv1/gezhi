import { SUBJECTS } from '../data/subjects'
import { builtinItems, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import { VideoCard } from '../components/VideoCard'
import { BackBar } from '../components/BackBar'
import type { Level, SubjectId } from '../lib/types'

const LEVEL_RANK: Record<Level, number> = { 入门: 0, 进阶: 1, 硬核: 2 }

export function SubjectPage({ id }: { id: SubjectId }) {
  const { prefs } = useStore()
  const subject = SUBJECTS.find(s => s.id === id)
  const items = mergeItems([...builtinItems], prefs)
    .filter(i => i.subject === id)
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.title.localeCompare(b.title, 'zh'))

  return (
    <div>
      <BackBar title="学科" />
      <header className="page-head">
        <h1 className="page-title">{subject?.name}</h1>
        <p className="page-sub">{items.length} 条精选 · 依难度排序</p>
      </header>
      {items.map(item => (
        <VideoCard key={item.id} item={item} meta={item.bvid ? prefs.metaCache[item.bvid] : undefined} />
      ))}
      {items.length === 0 && <p className="empty">该学科暂无内容。</p>}
    </div>
  )
}
