import { useState } from 'react'
import type { Question, VideoItem } from '../lib/types'

export function DailyCard({ course, question }: { course: VideoItem | null; question: Question }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="daily">
      <div>
        <span className="daily-label">今日一课</span>
        {course ? (
          <a className="daily-course-title" href={`#/item/${encodeURIComponent(course.id)}`}>{course.title}</a>
        ) : (
          <p className="muted">暂无内容</p>
        )}
      </div>
      <hr className="rule" />
      <div>
        <span className="daily-label">今日一题</span>
        <p className="question">{question.question}</p>
        <button className="text-btn" onClick={() => setOpen(v => !v)}>
          {open ? '收起答案' : '展开答案'}
        </button>
        {open && <p className="answer">{question.answer}</p>}
      </div>
    </section>
  )
}
