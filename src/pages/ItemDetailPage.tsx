import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { builtinItems, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import { canEnrich, enrichItem, isFresh, nativeFetcher, serialOnce } from '../lib/bilibili'
import { BackBar } from '../components/BackBar'
import { SUBJECTS } from '../data/subjects'
import { formatDuration, formatView } from '../lib/format'
import '../styles/detail.css'

export function ItemDetailPage({ id }: { id: string }) {
  const { prefs, ready, toggleBookmark, recordWatched, removeItem, setMeta } = useStore()
  const items = mergeItems([...builtinItems], prefs)
  const item = items.find(i => i.id === id)
  const meta = item?.bvid ? prefs.metaCache[item.bvid] : undefined
  const recorded = useRef(false)

  useEffect(() => {
    if (ready && item && !recorded.current) {
      recorded.current = true
      recordWatched(item.id)
    }
  }, [ready, item, recordWatched])

  useEffect(() => {
    const bvid = item?.bvid
    if (!bvid || !canEnrich(prefs)) return
    if (isFresh(prefs.metaCache[bvid], Date.now())) return
    let cancelled = false
    serialOnce(() => enrichItem(bvid, { fetcher: nativeFetcher(), now: () => Date.now() }))
      .then(entry => {
        if (entry && !cancelled) setMeta(bvid, entry)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.bvid, prefs.settings.enrichEnabled])

  if (!item) {
    return (
      <div>
        <BackBar title="内容" />
        <p className="empty">内容不存在或已被移除。</p>
      </div>
    )
  }

  const bookmarked = prefs.bookmarks.includes(item.id)
  const isCurated = item.curated !== false
  const subject = SUBJECTS.find(s => s.id === item.subject)

  const openVideo = async () => {
    const url = item.bvid ? `https://www.bilibili.com/video/${item.bvid}` : item.url
    if (!url) return
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url }).catch(() => undefined)
    } else {
      window.open(url, '_blank', 'noopener')
    }
  }

  const hideOrDelete = () => {
    if (!window.confirm(isCurated ? '从列表中隐藏这条内容？' : '删除这条内容？')) return
    removeItem(item.id)
    location.hash = '#/mine'
  }

  return (
    <div>
      <BackBar title="内容" />
      <header className="detail-head">
        <span className={`seal detail-seal cover-${item.subject}`}>{subject?.seal}</span>
        <h1 className="detail-title">{item.title}</h1>
        <p className="detail-meta">
          {item.upName} · {subject?.name} · {item.level}
          {meta?.duration ? ` · ${formatDuration(meta.duration)}` : ''}
          {meta?.view ? ` · ${formatView(meta.view)}播放` : ''}
        </p>
        {meta?.title && meta.title !== item.title && <p className="detail-meta">B 站标题：{meta.title}</p>}
      </header>
      <p className="detail-desc">{item.description}</p>
      {item.tags.length > 0 && (
        <p className="detail-tags">{item.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}</p>
      )}
      <div className="detail-actions">
        <button className="btn-primary" onClick={openVideo}>去 bilibili 学习</button>
        <div className="detail-subactions">
          <button className="btn-ghost" onClick={() => toggleBookmark(item.id)}>{bookmarked ? '已收藏' : '收藏'}</button>
          <button className="text-btn hide-btn" onClick={hideOrDelete}>{isCurated ? '从列表隐藏' : '删除'}</button>
        </div>
      </div>
    </div>
  )
}
