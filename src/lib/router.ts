import { SUBJECTS } from '../data/subjects'
import type { SubjectId } from './types'

export type Route =
  | { name: 'today' }
  | { name: 'subjects' }
  | { name: 'subject'; id: SubjectId }
  | { name: 'item'; id: string }
  | { name: 'mine' }
  | { name: 'add' }
  | { name: 'settings' }

function isSubjectId(v: string): v is SubjectId {
  return SUBJECTS.some(s => s.id === v)
}

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [seg, ...rest] = raw.split('/')
  const id = rest.join('/')
  switch (seg) {
    case 'subjects':
      return { name: 'subjects' }
    case 'subject':
      return isSubjectId(id) ? { name: 'subject', id } : { name: 'subjects' }
    case 'item': {
      if (!id) return { name: 'today' }
      try {
        return { name: 'item', id: decodeURIComponent(id) }
      } catch {
        return { name: 'today' }
      }
    }
    case 'mine':
      return { name: 'mine' }
    case 'add':
      return { name: 'add' }
    case 'settings':
      return { name: 'settings' }
    default:
      return { name: 'today' }
  }
}

export function routeHash(route: Route): string {
  switch (route.name) {
    case 'today':
      return '#/today'
    case 'subjects':
      return '#/subjects'
    case 'subject':
      return `#/subject/${route.id}`
    case 'item':
      return `#/item/${encodeURIComponent(route.id)}`
    case 'mine':
      return '#/mine'
    case 'add':
      return '#/add'
    case 'settings':
      return '#/settings'
  }
}

export function navigate(route: Route): void {
  location.hash = routeHash(route)
}
