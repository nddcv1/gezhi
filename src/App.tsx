import { useEffect, useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { StoreProvider, useStore } from './lib/store'
import { parseRoute, navigate, type Route } from './lib/router'
import { rescheduleDaily } from './lib/notify'
import { TabBar } from './components/TabBar'
import { Onboarding } from './components/Onboarding'
import { TodayPage } from './pages/TodayPage'
import { SubjectsPage } from './pages/SubjectsPage'
import { SubjectPage } from './pages/SubjectPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { MinePage } from './pages/MinePage'
import { AddItemPage } from './pages/AddItemPage'
import { SettingsPage } from './pages/SettingsPage'

function Shell() {
  const { prefs, ready } = useStore()
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash))

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!ready || !Capacitor.isNativePlatform()) return
    if (prefs.onboarded && prefs.settings.notifyEnabled) {
      void rescheduleDaily(prefs.settings).catch(() => undefined)
    }
    const listener = LocalNotifications.addListener('localNotificationActionPerformed', () => {
      navigate({ name: 'today' })
    })
    return () => {
      void listener.then(h => h.remove())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

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
      {ready && !prefs.onboarded && <Onboarding />}
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
