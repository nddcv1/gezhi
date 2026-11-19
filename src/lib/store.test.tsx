import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Preferences } from '@capacitor/preferences'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultPrefs } from './prefs'
import { StoreProvider, useStore } from './store'

vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: vi.fn(), set: vi.fn() },
}))

const getPrefs = vi.mocked(Preferences.get)
const setPrefs = vi.mocked(Preferences.set)

function Probe() {
  const { ready, prefs, toggleBookmark } = useStore()
  return (
    <div>
      <div data-testid="ready">{String(ready)}</div>
      <div data-testid="bookmarks">{prefs.bookmarks.join(',')}</div>
      <button type="button" onClick={() => toggleBookmark('x')}>切换书签</button>
    </div>
  )
}

beforeEach(() => {
  getPrefs.mockReset()
  setPrefs.mockReset()
  setPrefs.mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
})

describe('StoreProvider persistence', () => {
  it('does not overwrite stored prefs when the initial read fails', async () => {
    getPrefs.mockRejectedValue(new Error('preferences unavailable'))
    const user = userEvent.setup()

    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'))
    expect(setPrefs).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '切换书签' }))

    await waitFor(() => expect(setPrefs).toHaveBeenCalled())
    const saved = setPrefs.mock.calls.at(-1)?.[0]
    expect(saved?.value).toContain('"x"')
  })

  it('loads existing prefs and shows the stored bookmarks', async () => {
    getPrefs.mockResolvedValue({ value: JSON.stringify({ ...defaultPrefs(), bookmarks: ['keep'] }) })

    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('bookmarks')).toHaveTextContent('keep'))
  })
})
