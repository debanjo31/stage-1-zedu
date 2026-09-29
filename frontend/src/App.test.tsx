import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const task = {
  id: 1,
  title: 'Review launch notes',
  notes: 'Check every acceptance criterion',
  completed: false,
  priority: 'high',
  category: 'Work',
  due_date: '2026-10-10',
  created_at: '2026-09-29T09:00:00Z',
  updated_at: '2026-09-29T09:00:00Z',
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => {
      const url = String(input)
      if (url.includes('/stats')) return jsonResponse({ total: 1, completed: 0, active: 1, overdue: 0, completion_rate: 0 })
      return jsonResponse([task])
    }))
  })

  it('renders tasks with their notes and metadata', async () => {
    render(<App />)
    expect(await screen.findByText('Review launch notes')).toBeInTheDocument()
    expect(screen.getByText('Check every acceptance criterion')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('opens the new task form and validates the title', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Review launch notes')
    await user.click(screen.getAllByRole('button', { name: /new task/i })[0])
    expect(screen.getByRole('dialog', { name: /create a new task/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /add task/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Give your task a clear title.')
  })

  it('searches task notes after a debounce', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Review launch notes')
    await user.type(screen.getByRole('textbox', { name: /search tasks/i }), 'acceptance')
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('search=acceptance'), expect.anything()))
  })
})
