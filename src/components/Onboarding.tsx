import { useState } from 'react'
import { useStore } from '../lib/store'
import { ensureExactAlarm, ensurePermission, rescheduleDaily } from '../lib/notify'
import '../styles/onboarding.css'

export function Onboarding() {
  const { prefs, updateSettings, completeOnboarding } = useStore()
  const [busy, setBusy] = useState(false)

  async function enable() {
    setBusy(true)
    try {
      let granted = false
      try {
        granted = await ensurePermission()
      } catch {
        granted = false
      }
      if (granted) {
        await ensureExactAlarm()
        updateSettings({ notifyEnabled: true })
        await rescheduleDaily({ ...prefs.settings, notifyEnabled: true }).catch(() => undefined)
      } else {
        updateSettings({ notifyEnabled: false })
      }
    } finally {
      setBusy(false)
      completeOnboarding()
    }
  }

  function skip() {
    updateSettings({ notifyEnabled: false })
    completeOnboarding()
  }

  return (
    <div className="onboarding">
      <div className="onboarding-inner">
        <div className="onboarding-seal">格致</div>
        <h1 className="onboarding-title">格致明理</h1>
        <p className="onboarding-lead">一个只装学术内容的 bilibili 学习端。</p>
        <ul className="onboarding-points">
          <li>六学科精选 · 不含娱乐内容</li>
          <li>每日一题 · 每日通知提醒</li>
          <li>数据只留本机 · 无账号无追踪</li>
        </ul>
        <button className="btn-primary" onClick={() => void enable()} disabled={busy}>
          {busy ? '正在申请权限…' : '启用每日提醒'}
        </button>
        <button className="text-btn onboarding-skip" onClick={skip}>暂不提醒，先浏览</button>
        <p className="onboarding-hint">
          荣耀手机请在「设置 → 电池 → 应用启动管理」中允许本应用自动启动，否则定时提醒可能被系统拦截。
        </p>
      </div>
    </div>
  )
}
