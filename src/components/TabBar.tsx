const TABS = [
  { id: 'today', label: '今日', href: '#/today' },
  { id: 'subjects', label: '学科', href: '#/subjects' },
  { id: 'mine', label: '我的', href: '#/mine' },
] as const

export function TabBar({ active }: { active: 'today' | 'subjects' | 'mine' }) {
  return (
    <nav className="tabbar">
      {TABS.map(tab => (
        <a key={tab.id} className={`tab${active === tab.id ? ' is-active' : ''}`} href={tab.href}>
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
