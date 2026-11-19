import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelDaily, getPermissionStatus } from '../lib/notify'
import { defaultPrefs } from '../lib/prefs'
import { StoreProvider } from '../lib/store'
import { SettingsPage } from './SettingsPage'

vi.mock('../lib/notify', () => ({
  ensurePermission: vi.fn(),
  ensureExactAlarm: vi.fn(),
  rescheduleDaily: vi.fn(),
  sendTestNotification: vi.fn(),
  cancelDaily: vi.fn(),
  getPermissionStatus: vi.fn(),
}))

const cancelDailyMock = vi.mocked(cancelDaily)
const getPermissionStatusMock = vi.mocked(getPermissionStatus)

function renderSettings() {
  return render(
    <StoreProvider initialPrefs={defaultPrefs()}>
      <SettingsPage />
    </StoreProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getPermissionStatusMock.mockResolvedValue('granted')
})

afterEach(() => {
  cleanup()
})

describe('SettingsPage notification toggle', () => {
  it('reports failure when cancelling scheduled notifications rejects', async () => {
    cancelDailyMock.mockRejectedValue(new Error('cancel failed'))
    const user = userEvent.setup()
    renderSettings()

    const [notifySwitch] = screen.getAllByRole('checkbox')
    expect(notifySwitch).toBeChecked()
    await user.click(notifySwitch)

    expect(await screen.findByText('提醒设置已关闭，但取消已排期通知失败，请检查通知权限后重试。')).toBeInTheDocument()
    expect(screen.queryByText('已关闭每日提醒。')).not.toBeInTheDocument()
  })

  it('confirms when scheduled notifications are cancelled successfully', async () => {
    cancelDailyMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderSettings()

    const [notifySwitch] = screen.getAllByRole('checkbox')
    await user.click(notifySwitch)

    expect(await screen.findByText('已关闭每日提醒。')).toBeInTheDocument()
    expect(screen.queryByText('提醒设置已关闭，但取消已排期通知失败，请检查通知权限后重试。')).not.toBeInTheDocument()
  })
})
