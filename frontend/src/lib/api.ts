import type { Stats, Task, TaskDraft, TaskState } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail ?? 'Something went wrong. Please try again.')
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

export const api = {
  listTasks: (state: TaskState, search: string) => {
    const params = new URLSearchParams({ state })
    if (search.trim()) params.set('search', search.trim())
    return request<Task[]>(`/tasks?${params}`)
  },
  getStats: () => request<Stats>('/stats'),
  createTask: (task: TaskDraft) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id: number, updates: Partial<TaskDraft & { completed: boolean }>) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
}
