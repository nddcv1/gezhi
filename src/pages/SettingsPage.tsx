import { useEffect, useState } from 'react'
import { BackBar } from '../components/BackBar'
import { useStore } from '../lib/store'
import {
  cancelDaily,
  ensureExactAlarm,
  ensurePermission,
  getPermissionStatus,
  rescheduleDaily,
  sendTestNotification,
  type PermissionStatus,
} from '../lib/notify'
import '../styles/settings.css'

export function SettingsPage() {
  const { prefs, updateSettings, restoreAll } = useStore()
  const [message, setMessage] = useState('')
  const [permission, setPermission] = useState<PermissionStatus>('unknown')
  const { settings } = prefs

  async function refreshPermission() {
    setPermission(await getPermissionStatus())
  }

  useEffect(() => {
    void refreshPermission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const permissionText =
    permission === 'granted' ? '通知权限：已授予'
    : permission === 'denied' ? '通知权限：已拒绝，请在系统设置中开启'
    : permission === 'prompt' ? '通知权限：未请求'
    : '通知权限状态不可用（浏览器预览正常工作，安卓真机才需要）'

  async function toggleNotify(enabled: boolean) {
    setMessage('')
    if (enabled) {
      try {
        const granted = await ensurePermission()
        if (!granted) {
          setMessage('通知权限未授予，请在系统设置中允许通知。')
          return
        }
        await ensureExactAlarm()
        updateSettings({ notifyEnabled: true })
        await rescheduleDaily({ ...settings, notifyEnabled: true })
        setMessage('已开启每日提醒。')
      } catch {
        setMessage('通知设置失败，请检查系统权限。')
        updateSettings({ notifyEnabled: false })
      } finally {
        await refreshPermission()
      }
      return
    }
    updateSettings({ notifyEnabled: false })
    try {
      await cancelDaily()
    } catch {
      // 取消失败不影响开关状态
    }
    setMessage('已关闭每日提醒。')
    await refreshPermission()
  }

  async function changeTime(value: string) {
    if (!value) return
    updateSettings({ notifyTime: value })
    if (!settings.notifyEnabled) {
      setMessage(`提醒时间改为 ${value}。`)
      return
    }
    try {
      await rescheduleDaily({ ...settings, notifyTime: value })
      setMessage(`提醒时间改为 ${value}。`)
    } catch {
      setMessage('提醒时间已保存，但排期失败，请检查通知权限。')
    }
  }

  async function test() {
    setMessage('')
    const granted = await ensurePermission()
    if (!granted) {
      setMessage('通知权限未授予，无法发送测试通知。')
      return
    }
    try {
      await sendTestNotification()
      setMessage('测试通知将在 3 秒后到达（仅安卓端生效）。')
    } catch {
      setMessage('测试通知发送失败，请检查通知权限。')
    }
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
      <p className="settings-hint">{permissionText}</p>
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
