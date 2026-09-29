from contextlib import asynccontextmanager
from datetime import date
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import Base, engine, get_db
from .models import Priority, Task
from .schemas import TaskCreate, TaskRead, TaskStats, TaskUpdate


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/tasks", response_model=list[TaskRead])
def list_tasks(
    db: Session = Depends(get_db),
    state: Literal["all", "active", "completed"] = "all",
    priority: Priority | None = None,
    category: str | None = None,
    search: str | None = Query(default=None, max_length=180),
):
    query = select(Task)
    if state == "active":
        query = query.where(Task.completed.is_(False))
    elif state == "completed":
        query = query.where(Task.completed.is_(True))
    if priority:
        query = query.where(Task.priority == priority)
    if category:
        query = query.where(Task.category == category)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(or_(Task.title.ilike(term), Task.notes.ilike(term)))
    query = query.order_by(Task.completed.asc(), Task.due_date.is_(None), Task.due_date, Task.created_at.desc())
    return db.scalars(query).all()


@app.post("/api/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    task = Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task_or_404(task_id: int, db: Session) -> Task:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.get("/api/tasks/{task_id}", response_model=TaskRead)
def get_task(task_id: int, db: Session = Depends(get_db)):
    return get_task_or_404(task_id, db)


@app.patch("/api/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = get_task_or_404(task_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = get_task_or_404(task_id, db)
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/stats", response_model=TaskStats)
def task_stats(db: Session = Depends(get_db)):
    today = date.today()
    row = db.execute(
        select(
            func.count(Task.id),
            func.coalesce(func.sum(case((Task.completed.is_(True), 1), else_=0)), 0),
            func.coalesce(func.sum(case((Task.completed.is_(False), 1), else_=0)), 0),
            func.coalesce(
                func.sum(
                    case(
                        ((Task.completed.is_(False) & (Task.due_date < today)), 1),
                        else_=0,
                    )
                ),
                0,
            ),
        )
    ).one()
    total, completed, active, overdue = (int(value) for value in row)
    return TaskStats(
        total=total,
        completed=completed,
        active=active,
        overdue=overdue,
        completion_rate=round((completed / total) * 100) if total else 0,
    )
