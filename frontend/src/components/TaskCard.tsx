import { CalendarDays, Check, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Task } from '../types'

interface TaskCardProps {
  task: Task
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function formatDueDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const label = date.getTime() === today.getTime() ? 'Today' : date.getTime() === tomorrow.getTime() ? 'Tomorrow' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return { label, overdue: date < today }
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const due = task.due_date ? formatDueDate(task.due_date) : null

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <article className={`task-card ${task.completed ? 'is-complete' : ''}`}>
      <button
        className="task-check"
        aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`}
        aria-pressed={task.completed}
        onClick={() => onToggle(task)}
      >
        {task.completed && <Check size={15} strokeWidth={3} />}
      </button>
      <button className="task-content" onClick={() => onEdit(task)}>
        <span className="task-title">{task.title}</span>
        {task.notes && <span className="task-notes"><FileText size={14} />{task.notes}</span>}
        <span className="task-meta">
          <span className={`priority-dot ${task.priority}`} />
          <span>{task.priority[0].toUpperCase() + task.priority.slice(1)}</span>
          <span className="meta-divider" />
          <span className="category-pill">{task.category}</span>
          {due && <><span className="meta-divider" /><span className={due.overdue && !task.completed ? 'due overdue' : 'due'}><CalendarDays size={13} />{due.label}</span></>}
        </span>
      </button>
      <div className="task-menu-wrap" ref={menuRef}>
        <button className="icon-button task-menu-button" aria-label={`Actions for ${task.title}`} onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={19} /></button>
        {menuOpen && (
          <div className="task-menu">
            <button onClick={() => { onEdit(task); setMenuOpen(false) }}><Pencil size={15} /> Edit</button>
            <button className="danger" onClick={() => { onDelete(task); setMenuOpen(false) }}><Trash2 size={15} /> Delete</button>
          </div>
        )}
      </div>
    </article>
  )
}
