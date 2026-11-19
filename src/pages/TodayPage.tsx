import { useMemo } from 'react'
import { builtinItems, questions, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import { dailyCourse, dailyFeed, dailyQuestion } from '../lib/rotation'
import { DailyCard } from '../components/DailyCard'
import { VideoCard } from '../components/VideoCard'
import { formatDate } from '../lib/format'
import '../styles/today.css'

export function TodayPage() {
  const { prefs } = useStore()
  const now = new Date()
  const items = useMemo(() => mergeItems([...builtinItems], prefs), [prefs])
  const feed = useMemo(() => dailyFeed(items, prefs, now).slice(0, 20), [items, prefs])
  const course = dailyCourse(items, prefs, now)
  const question = dailyQuestion(questions, now)

  return (
    <div>
      <header className="page-head">
        <h1 className="page-title">今日</h1>
        <p className="page-sub">{formatDate(now)}</p>
      </header>
      <DailyCard course={course} question={question} />
      <div className="section-head">
        <h2 className="section-title">今日荐读</h2>
        <span className="muted">{feed.length} 条</span>
      </div>
      {feed.map(item => (
        <VideoCard key={item.id} item={item} meta={item.bvid ? prefs.metaCache[item.bvid] : undefined} />
      ))}
      {feed.length === 0 && <p className="empty">内容库为空，请先在「我的 → 添加内容」添加。</p>}
      <p className="feed-hint"><a className="text-btn" href="#/subjects">按学科浏览全部内容 →</a></p>
    </div>
  )
}
