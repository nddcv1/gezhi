import type { SubjectId } from '../lib/types'

export interface SubjectDef {
  id: SubjectId
  name: string
  seal: string
}

export const SUBJECTS: SubjectDef[] = [
  { id: 'math', name: '数学', seal: '數' },
  { id: 'physics', name: '物理', seal: '物' },
  { id: 'cs', name: '计算机', seal: '機' },
  { id: 'econ', name: '经济', seal: '經' },
  { id: 'philosophy', name: '哲学', seal: '哲' },
  { id: 'humanities', name: '人文', seal: '文' },
]

export function subjectName(id: SubjectId): string {
  return SUBJECTS.find(s => s.id === id)?.name ?? id
}
