import { SUBJECTS } from '../data/subjects'
import { builtinItems, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import '../styles/subjects.css'

export function SubjectsPage() {
  const { prefs } = useStore()
  const items = mergeItems([...builtinItems], prefs)

  return (
    <div>
      <header className="page-head">
        <h1 className="page-title">学科</h1>
        <p className="page-sub">格物致知</p>
      </header>
      <ul className="subject-list">
        {SUBJECTS.map(subject => {
          const count = items.filter(i => i.subject === subject.id).length
          return (
            <li key={subject.id}>
              <a className={`subject-row subject-row-${subject.id}`} href={`#/subject/${subject.id}`}>
                <span className="seal">{subject.seal}</span>
                <span className="subject-name">{subject.name}</span>
                <span className="subject-count">{count} 条</span>
                <span className="subject-arrow">→</span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
