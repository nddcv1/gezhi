import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { StoreProvider } from '../lib/store'
import { defaultPrefs } from '../lib/prefs'
import { AddItemPage } from './AddItemPage'

function renderPage() {
  return render(
    <StoreProvider initialPrefs={defaultPrefs()}>
      <AddItemPage />
    </StoreProvider>,
  )
}

afterEach(() => {
  cleanup()
})

describe('AddItemPage', () => {
  it('shows an error for empty input', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: '添加' }))
    expect(screen.getByRole('status')).toHaveTextContent('请粘贴 BV 号或视频链接')
  })

  it('adds a bilibili link and confirms', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('BV 号 / 视频链接'), 'https://www.bilibili.com/video/BV1AA411c7mD/?p=1')
    await user.click(screen.getByRole('button', { name: '添加' }))
    expect(screen.getByRole('status')).toHaveTextContent('已添加')
  })
})
