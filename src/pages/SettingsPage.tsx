import { useState } from 'react'
import { BackBar } from '../components/BackBar'
import { useStore } from '../lib/store'
import { ensureExactAlarm, ensurePermission, rescheduleDaily, sendTestNotification } from '../lib/notify'
import '../styles/settings.css'

export function SettingsPage() {
  const { prefs, updateSettings, restoreAll } = useStore()
  const [message, setMessage] = useState('')
  const { settings } = prefs

  async function toggleNotify(enabled: boolean) {
    setMessage('')
    if (enabled) {
      const granted = await ensurePermission()
      if (!granted) {
        setMessage('通知权限未授予，请在系统设置中允许通知。')
        return
      }
      await ensureExactAlarm()
    }
    updateSettings({ notifyEnabled: enabled })
    const next = { ...settings, notifyEnabled: enabled }
    await rescheduleDaily(next).catch(() => undefined)
    setMessage(enabled ? '已开启每日提醒。' : '已关闭每日提醒。')
  }

  async function changeTime(value: string) {
    if (!value) return
    updateSettings({ notifyTime: value })
    if (settings.notifyEnabled) {
      await rescheduleDaily({ ...settings, notifyTime: value }).catch(() => undefined)
    }
    setMessage(`提醒时间改为 ${value}。`)
  }

  async function test() {
    setMessage('')
    const granted = await ensurePermission()
    if (!granted) {
      setMessage('通知权限未授予，无法发送测试通知。')
      return
    }
    await sendTestNotification().catch(() => undefined)
    setMessage('测试通知将在 3 秒后到达（仅安卓端生效）。')
  }

  return (
    <div>
      <BackBar title="通知设置" />
      <header className="page-head">
        <h1 className="page-title">通知</h1>
        <p className="page-sub">每日一题提醒</p>
      </header>
      <div className="field-row">
        <span>每日提醒</span>
        <input type="checkbox" className="switch" checked={settings.notifyEnabled} onChange={e => void toggleNotify(e.target.checked)} />
      </div>
      <label className="label" htmlFor="notify-time">提醒时间</label>
      <input id="notify-time" type="time" className="input" value={settings.notifyTime} onChange={e => void changeTime(e.target.value)} />
      <button className="btn-ghost test-btn" onClick={() => void test()}>发送测试通知</button>
      {message && <p className="form-message" role="status">{message}</p>}
      <hr className="rule" />
      <div className="field-row">
        <span>联网补充元数据</span>
        <input type="checkbox" className="switch" checked={settings.enrichEnabled} onChange={e => updateSettings({ enrichEnabled: e.target.checked })} />
      </div>
      <p className="settings-hint">关闭后应用完全不发起网络请求，只显示内置内容。</p>
      {prefs.removedIds.length > 0 && (
        <button className="btn-ghost restore-btn" onClick={() => { restoreAll(); setMessage('已恢复全部隐藏内容。') }}>
          恢复已隐藏内容（{prefs.removedIds.length}）
        </button>
      )}
      <hr className="rule" />
      <p className="settings-hint">
        荣耀 MagicOS 对后台限制较严。若提醒不按时到达，请在「设置 → 电池 → 应用启动管理」中允许本应用自动启动，并允许「精确闹钟」权限。
      </p>
    </div>
  )
}
