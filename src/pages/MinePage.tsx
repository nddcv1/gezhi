import { builtinItems, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import { SUBJECTS } from '../data/subjects'
import { formatDate } from '../lib/format'
import type { VideoItem } from '../lib/types'
import '../styles/mine.css'

export function MinePage() {
  const { prefs } = useStore()
  const items = mergeItems([...builtinItems], prefs)
  const bookmarks = items.filter(i => prefs.bookmarks.includes(i.id))
  const watched = prefs.watched
    .map(w => items.find(i => i.id === w.id))
    .filter((i): i is VideoItem => Boolean(i))
    .slice(0, 20)

  const sealOf = (subjectId: string) => SUBJECTS.find(s => s.id === subjectId)?.seal

  return (
    <div>
      <header className="page-head">
        <h1 className="page-title">我的</h1>
        <p className="page-sub">学而时习之</p>
      </header>
      <nav className="mine-nav">
        <a href="#/add">添加内容</a>
        <a href="#/settings">通知设置</a>
      </nav>
      <div className="section-head"><h2 className="section-title">收藏</h2><span className="muted">{bookmarks.length} 条</span></div>
      {bookmarks.length === 0 && <p className="empty">还没有收藏。在内容详情页点「收藏」。</p>}
      <ul className="mine-list">
        {bookmarks.map(item => (
          <li key={item.id}>
            <a className="mine-row" href={`#/item/${encodeURIComponent(item.id)}`}>
              <span className="seal small-seal">{sealOf(item.subject)}</span>
              <span className="mine-row-title">{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="section-head"><h2 className="section-title">学习记录</h2><span className="muted">最近</span></div>
      {watched.length === 0 && <p className="empty">还没有学习记录。</p>}
      <ul className="mine-list">
        {watched.map(item => (
          <li key={item.id}>
            <a className="mine-row" href={`#/item/${encodeURIComponent(item.id)}`}>
              <span className="mine-row-title">{item.title}</span>
              <span className="mine-row-date">{formatDate(new Date(prefs.watched.find(w => w.id === item.id)?.at ?? Date.now()))}</span>
            </a>
          </li>
        ))}
      </ul>
      <hr className="rule" />
      <p className="about">
        格致明理 0.1.0 · 只收学术内容的学习端<br />
        内容版权归原作者所有，播放跳转 bilibili 官方页面。<br />
        所有数据仅保存在本机。
      </p>
    </div>
  )
}
