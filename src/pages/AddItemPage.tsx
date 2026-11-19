import { useState, type FormEvent } from 'react'
import { BackBar } from '../components/BackBar'
import { SUBJECTS } from '../data/subjects'
import { builtinItems, useStore } from '../lib/store'
import { parseBvid } from '../lib/bvid'
import type { Level, SubjectId, VideoItem } from '../lib/types'
import '../styles/add.css'

const LEVELS: Level[] = ['入门', '进阶', '硬核']

export function AddItemPage() {
  const { addItem, prefs } = useStore()
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [upName, setUpName] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState<SubjectId>('math')
  const [level, setLevel] = useState<Level>('入门')
  const [message, setMessage] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    const trimmed = input.trim()
    if (!trimmed) {
      setMessage('请粘贴 BV 号或视频链接。')
      return
    }
    const bvid = parseBvid(trimmed)
    if (!bvid && !/^https?:\/\//.test(trimmed)) {
      setMessage('无法识别 BV 号，请输入完整的 bilibili 视频链接。')
      return
    }
    const finalTitle = title.trim() || bvid || ''
    if (!finalTitle) {
      setMessage('请填写标题。')
      return
    }
    const id = bvid ? bvid.toLowerCase() : `user-${Date.now().toString(36)}`
    const exists = builtinItems.some(i => i.id === id) || prefs.addedItems.some(i => i.id === id)
    if (exists) {
      setMessage('这条内容已经存在。')
      return
    }
    const item: VideoItem = {
      id,
      ...(bvid ? { bvid } : { url: trimmed }),
      title: finalTitle,
      upName: upName.trim() || '待补充',
      subject,
      level,
      tags: [],
      description: description.trim() || '用户添加的内容。',
      addedAt: Date.now(),
      curated: false,
    }
    addItem(item)
    setMessage('已添加，可在「我的」中查看。')
    setInput('')
    setTitle('')
  }

  return (
    <div>
      <BackBar title="添加内容" />
      <header className="page-head">
        <h1 className="page-title">添加内容</h1>
        <p className="page-sub">粘贴 BV 号或视频链接</p>
      </header>
      <form onSubmit={submit} className="add-form">
        <label className="label" htmlFor="add-input">BV 号 / 视频链接</label>
        <input id="add-input" className="input" value={input} onChange={e => setInput(e.target.value)} placeholder="BV1xx411c7mD 或 https://www.bilibili.com/video/..." />
        <label className="label" htmlFor="add-title">标题（可选）</label>
        <input id="add-title" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="课程名称" />
        <label className="label" htmlFor="add-up">UP 主（可选）</label>
        <input id="add-up" className="input" value={upName} onChange={e => setUpName(e.target.value)} placeholder="UP 主名" />
        <label className="label" htmlFor="add-subject">学科</label>
        <select id="add-subject" className="select" value={subject} onChange={e => setSubject(e.target.value as SubjectId)}>
          {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="label" htmlFor="add-level">难度</label>
        <select id="add-level" className="select" value={level} onChange={e => setLevel(e.target.value as Level)}>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <label className="label" htmlFor="add-desc">推荐语（可选）</label>
        <input id="add-desc" className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="一句话说明讲什么" />
        {message && <p className="form-message" role="status">{message}</p>}
        <button type="submit" className="btn-primary add-submit">添加</button>
      </form>
    </div>
  )
}
