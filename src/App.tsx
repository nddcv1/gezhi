import { useEffect, useState, type ReactNode } from 'react'
import { StoreProvider } from './lib/store'
import { parseRoute, type Route } from './lib/router'
import { TabBar } from './components/TabBar'
import { TodayPage } from './pages/TodayPage'
import { SubjectsPage } from './pages/SubjectsPage'
import { SubjectPage } from './pages/SubjectPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { MinePage } from './pages/MinePage'
import { AddItemPage } from './pages/AddItemPage'
import { SettingsPage } from './pages/SettingsPage'

function Shell() {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash))

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  let page: ReactNode
  switch (route.name) {
    case 'today': page = <TodayPage />; break
    case 'subjects': page = <SubjectsPage />; break
    case 'subject': page = <SubjectPage id={route.id} />; break
    case 'item': page = <ItemDetailPage id={route.id} />; break
    case 'mine': page = <MinePage />; break
    case 'add': page = <AddItemPage />; break
    case 'settings': page = <SettingsPage />; break
  }

  const active =
    route.name === 'today' ? 'today'
    : route.name === 'subjects' || route.name === 'subject' ? 'subjects'
    : route.name === 'mine' ? 'mine'
    : null

  return (
    <div className="app">
      <main className="app-main">{page}</main>
      {active && <TabBar active={active} />}
    </div>
  )
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
