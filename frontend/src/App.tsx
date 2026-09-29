import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Circle, Inbox, ListTodo, Plus, RefreshCw, Search, Sparkles } from 'lucide-react'
import { TaskCard } from './components/TaskCard'
import { TaskForm } from './components/TaskForm'
import { api } from './lib/api'
import type { Stats, Task, TaskDraft, TaskState } from './types'

const emptyStats: Stats = { total: 0, completed: 0, active: 0, overdue: 0, completion_rate: 0 }

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [state, setState] = useState<TaskState>('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [taskData, statsData] = await Promise.all([api.listTasks(state, query), api.getStats()])
      setTasks(taskData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your tasks.')
    } finally {
      setLoading(false)
    }
  }, [state, query])

  useEffect(() => { void loadData() }, [loadData])
  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(search), 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  const todayLabel = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), [])

  function openCreate() {
    setEditingTask(null)
    setFormOpen(true)
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setFormOpen(true)
  }

  async function saveTask(draft: TaskDraft) {
    setBusy(true)
    setError('')
    try {
      if (editingTask) await api.updateTask(editingTask.id, draft)
      else await api.createTask(draft)
      setFormOpen(false)
      setEditingTask(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the task.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleTask(task: Task) {
    const completed = !task.completed
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed } : item))
    try {
      await api.updateTask(task.id, { completed })
      await loadData()
    } catch {
      setError('That update did not stick. Please try again.')
      await loadData()
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return
    try {
      await api.deleteTask(task.id)
      await loadData()
    } catch {
      setError('Could not delete the task.')
    }
  }

  const filters: { key: TaskState; label: string; count: number; icon: typeof Inbox }[] = [
    { key: 'all', label: 'All tasks', count: stats.total, icon: Inbox },
    { key: 'active', label: 'Active', count: stats.active, icon: Circle },
    { key: 'completed', label: 'Completed', count: stats.completed, icon: CheckCircle2 },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><ListTodo size={20} /></span><span>Zedu</span></div>
        <nav aria-label="Task views">
          <span className="nav-label">My space</span>
          {filters.map(({ key, label, count, icon: Icon }) => (
            <button key={key} className={`nav-item ${state === key ? 'active' : ''}`} onClick={() => setState(key)}>
              <Icon size={17} /><span>{label}</span><strong>{count}</strong>
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <div className="progress-ring" style={{ '--progress': `${stats.completion_rate * 3.6}deg` } as React.CSSProperties}>
            <span>{stats.completion_rate}%</span>
          </div>
          <div><strong>Weekly rhythm</strong><p>{stats.completed ? `${stats.completed} task${stats.completed === 1 ? '' : 's'} completed. Keep going.` : 'Small steps build momentum.'}</p></div>
        </div>
        <div className="sidebar-footer"><Sparkles size={15} /><span>Make space for what matters.</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><ListTodo size={19} /></span>Zedu</div>
          <label className="search-box">
            <Search size={18} />
            <input aria-label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks and notes…" />
            <kbd>⌘ K</kbd>
          </label>
          <button className="button primary desktop-add" onClick={openCreate}><Plus size={18} /> New task</button>
        </header>

        <div className="workspace">
          <section className="welcome-row">
            <div><span className="eyebrow">{todayLabel}</span><h1>Good day. <em>What’s the plan?</em></h1><p>Keep it simple, clear, and moving forward.</p></div>
            <button className="button primary mobile-add" onClick={openCreate}><Plus size={18} /> New task</button>
          </section>

          <section className="stats-grid" aria-label="Task summary">
            <div className="stat-card coral"><span className="stat-icon"><ListTodo size={20} /></span><div><strong>{stats.active}</strong><span>Tasks to do</span></div></div>
            <div className="stat-card green"><span className="stat-icon"><CheckCircle2 size={20} /></span><div><strong>{stats.completed}</strong><span>Completed</span></div></div>
            <div className="stat-card amber"><span className="stat-icon"><AlertCircle size={20} /></span><div><strong>{stats.overdue}</strong><span>Overdue</span></div></div>
          </section>

          <section className="tasks-section">
            <div className="section-heading">
              <div><h2>{filters.find((filter) => filter.key === state)?.label}</h2><span>{tasks.length} shown</span></div>
              <div className="filter-tabs" role="group" aria-label="Filter tasks">
                {filters.map((filter) => <button key={filter.key} className={state === filter.key ? 'active' : ''} onClick={() => setState(filter.key)}>{filter.label.replace(' tasks', '')}</button>)}
              </div>
            </div>

            {error && <div className="error-banner" role="alert"><AlertCircle size={18} /><span>{error}</span><button onClick={() => void loadData()}><RefreshCw size={15} /> Retry</button></div>}

            {loading ? (
              <div className="task-list" aria-label="Loading tasks">{[1, 2, 3].map((item) => <div className="task-skeleton" key={item} />)}</div>
            ) : tasks.length ? (
              <div className="task-list">{tasks.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} onEdit={openEdit} onDelete={deleteTask} />)}</div>
            ) : (
              <div className="empty-state"><span><Inbox size={28} /></span><h3>{query ? 'No matching tasks' : state === 'completed' ? 'Nothing checked off yet' : 'Your list is beautifully clear'}</h3><p>{query ? 'Try a different word or clear your search.' : 'Add a task when you’re ready to make progress.'}</p>{!query && <button className="button soft" onClick={openCreate}><Plus size={17} /> Add your first task</button>}</div>
            )}
          </section>
        </div>
      </main>
      <TaskForm open={formOpen} editingTask={editingTask} busy={busy} onClose={() => setFormOpen(false)} onSubmit={saveTask} />
    </div>
  )
}
