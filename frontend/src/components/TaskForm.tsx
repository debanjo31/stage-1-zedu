import { FormEvent, useEffect, useRef, useState } from 'react'
import { CalendarDays, FileText, Flag, Layers3, Plus, X } from 'lucide-react'
import type { Task, TaskDraft } from '../types'

interface TaskFormProps {
  open: boolean
  editingTask: Task | null
  busy: boolean
  onClose: () => void
  onSubmit: (draft: TaskDraft) => Promise<void>
}

const emptyDraft: TaskDraft = {
  title: '',
  notes: '',
  priority: 'medium',
  category: 'Personal',
  due_date: null,
}

export function TaskForm({ open, editingTask, busy, onClose, onSubmit }: TaskFormProps) {
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setDraft(
      editingTask
        ? {
            title: editingTask.title,
            notes: editingTask.notes,
            priority: editingTask.priority,
            category: editingTask.category,
            due_date: editingTask.due_date,
          }
        : emptyDraft,
    )
    setError('')
    window.setTimeout(() => titleRef.current?.focus(), 50)
  }, [open, editingTask])

  if (!open) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.title.trim()) {
      setError('Give your task a clear title.')
      return
    }
    await onSubmit({ ...draft, title: draft.title.trim(), category: draft.category.trim() || 'Personal' })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-form-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{editingTask ? 'Make it better' : 'Capture the thought'}</span>
            <h2 id="task-form-title">{editingTask ? 'Edit task' : 'Create a new task'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close task form"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field full-field">
            <span>Task title</span>
            <input
              ref={titleRef}
              value={draft.title}
              maxLength={180}
              placeholder="What needs to get done?"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="field full-field">
            <span><FileText size={15} /> Notes</span>
            <textarea
              value={draft.notes}
              maxLength={5000}
              rows={5}
              placeholder="Add context, ideas, links, or a checklist…"
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span><Flag size={15} /> Priority</span>
              <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskDraft['priority'] })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="field">
              <span><Layers3 size={15} /> Category</span>
              <input value={draft.category} maxLength={60} placeholder="Personal" onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            </label>
            <label className="field full-field">
              <span><CalendarDays size={15} /> Due date</span>
              <input type="date" value={draft.due_date ?? ''} onChange={(e) => setDraft({ ...draft, due_date: e.target.value || null })} />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="button primary" disabled={busy}>
              <Plus size={17} /> {busy ? 'Saving…' : editingTask ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
