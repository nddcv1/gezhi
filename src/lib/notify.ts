import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Settings } from './types'

const DAY_MS = 86_400_000

export function next30Days(time: string, from: Date): Date[] {
  const [hour, minute] = time.split(':').map(Number)
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate(), hour, minute, 0, 0)
  const first = today.getTime() <= from.getTime() ? new Date(today.getTime() + DAY_MS) : today
  return Array.from({ length: 30 }, (_, i) =>
    new Date(first.getFullYear(), first.getMonth(), first.getDate() + i, hour, minute, 0, 0),
  )
}

export function notificationId(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export async function ensurePermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const current = await LocalNotifications.checkPermissions()
  if (current.display === 'granted') return true
  const requested = await LocalNotifications.requestPermissions()
  return requested.display === 'granted'
}

export async function cancelDaily(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) })
  }
}

export async function rescheduleDaily(settings: Settings, now = new Date()): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await cancelDaily()
  if (!settings.notifyEnabled) return
  const dates = next30Days(settings.notifyTime, now)
  await LocalNotifications.schedule({
    notifications: dates.map(date => ({
      id: notificationId(date),
      title: '格致明理 · 今日学习',
      body: '今日一题已备好，静下心来想三分钟。',
      schedule: { at: date, allowWhileIdle: true },
      smallIcon: 'ic_stat_gezhi',
    })),
  })
}

export async function sendTestNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: '格致明理',
        body: '测试通知：通知通道正常。',
        schedule: { at: new Date(Date.now() + 3000) },
        smallIcon: 'ic_stat_gezhi',
      },
    ],
  })
}

export async function ensureExactAlarm(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const status = await LocalNotifications.checkExactNotificationSetting()
    if (status.exact_alarm !== 'granted') {
      await LocalNotifications.changeExactNotificationSetting()
    }
  } catch {
    // 设备不支持精确闹钟设置时忽略，通知仍按普通闹钟调度
  }
}
