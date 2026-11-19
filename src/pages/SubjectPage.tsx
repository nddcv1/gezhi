import type { SubjectId } from '../lib/types'

export function SubjectPage({ id }: { id: SubjectId }) {
  return <div><header className="page-head"><h1 className="page-title">{id}</h1></header></div>
}
