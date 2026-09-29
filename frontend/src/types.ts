export type Priority = 'low' | 'medium' | 'high'
export type TaskState = 'all' | 'active' | 'completed'

export interface Task {
  id: number
  title: string
  notes: string
  completed: boolean
  priority: Priority
  category: string
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface TaskDraft {
  title: string
  notes: string
  priority: Priority
  category: string
  due_date: string | null
}

export interface Stats {
  total: number
  completed: number
  active: number
  overdue: number
  completion_rate: number
}
