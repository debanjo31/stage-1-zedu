from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import Priority


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    notes: str = Field(default="", max_length=5000)
    priority: Priority = Priority.medium
    category: str = Field(default="Personal", min_length=1, max_length=60)
    due_date: date | None = None

    @field_validator("title", "category")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    notes: str | None = Field(default=None, max_length=5000)
    completed: bool | None = None
    priority: Priority | None = None
    category: str | None = Field(default=None, min_length=1, max_length=60)
    due_date: date | None = None

    @field_validator("title", "category")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class TaskRead(TaskBase):
    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskStats(BaseModel):
    total: int
    completed: int
    active: int
    overdue: int
    completion_rate: int
