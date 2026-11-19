import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { StoreProvider, questions } from '../lib/store'
import { defaultPrefs } from '../lib/prefs'
import { dailyQuestion } from '../lib/rotation'
import { TodayPage } from './TodayPage'

function renderPage() {
  return render(
    <StoreProvider initialPrefs={defaultPrefs()}>
      <TodayPage />
    </StoreProvider>,
  )
}

afterEach(() => {
  cleanup()
})

describe('TodayPage', () => {
  it('renders the daily course and question card', () => {
    renderPage()
    expect(screen.getByText('今日一课')).toBeInTheDocument()
    expect(screen.getByText('今日一题')).toBeInTheDocument()
  })

  it('renders a non-empty feed of video links', () => {
    renderPage()
    const links = screen.getAllByRole('link').filter(a => a.getAttribute('href')?.startsWith('#/item/'))
    expect(links.length).toBeGreaterThan(0)
  })

  it('reveals the answer when asked', async () => {
    const user = userEvent.setup()
    renderPage()
    const expected = dailyQuestion(questions, new Date()).answer
    await user.click(screen.getByRole('button', { name: '展开答案' }))
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})
