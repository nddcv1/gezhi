import type { MetaCacheEntry, VideoItem } from '../lib/types'
import { SUBJECTS } from '../data/subjects'
import { formatDuration, formatView } from '../lib/format'

export function VideoCard({ item, meta }: { item: VideoItem; meta?: MetaCacheEntry }) {
  const subject = SUBJECTS.find(s => s.id === item.subject)
  return (
    <a className="card" href={`#/item/${encodeURIComponent(item.id)}`}>
      <div className={`cover cover-${item.subject}`}>
        <span className="seal">{subject?.seal}</span>
        <span className="cover-title">{item.title.slice(0, 24)}</span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{item.title}</h3>
        <p className="card-meta">
          {item.upName} · {item.level}
          {meta?.duration ? ` · ${formatDuration(meta.duration)}` : ''}
          {meta?.view ? ` · ${formatView(meta.view)}播放` : ''}
        </p>
        <p className="card-desc">{item.description}</p>
      </div>
    </a>
  )
}
