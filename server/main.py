from datetime import datetime, timezone
from typing import List, Optional

import strawberry
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter


@strawberry.type
class Category:
    name: str
    color: str


@strawberry.type
class Task:
    id: strawberry.ID
    title: str
    description: str
    is_completed: bool
    category: Category
    created_at: str


@strawberry.input
class TaskInput:
    title: str
    description: str = ""
    category_name: str = "Без категории"


tasks_db: List[Task] = [
    Task(
        id=strawberry.ID("1"),
        title="Изучить Apollo Client",
        description="Подключить React к GraphQL API.",
        is_completed=False,
        category=Category(name="Учёба", color="blue"),
        created_at="2026-09-20T10:00:00+00:00",
    ),
    Task(
        id=strawberry.ID("2"),
        title="Описать GraphQL-схему",
        description="Проверить типы Query и Mutation.",
        is_completed=True,
        category=Category(name="Проект", color="green"),
        created_at="2026-09-21T10:30:00+00:00",
    ),
    Task(
        id=strawberry.ID("3"),
        title="Протестировать мутации",
        description="Проверить создание и завершение задач.",
        is_completed=False,
        category=Category(name="Практика", color="orange"),
        created_at="2026-09-22T09:15:00+00:00",
    ),
]


def next_task_id() -> strawberry.ID:
    return strawberry.ID(str(max(int(task.id) for task in tasks_db) + 1))


@strawberry.type
class Query:
    @strawberry.field
    def all_tasks(self) -> List[Task]:
        return tasks_db

    @strawberry.field
    def task(self, id: strawberry.ID) -> Optional[Task]:
        return next((item for item in tasks_db if item.id == id), None)


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_task(self, input: TaskInput) -> Task:
        title = input.title.strip()
        if not title:
            raise ValueError("Название задачи не может быть пустым")

        task = Task(
            id=next_task_id(),
            title=title,
            description=input.description.strip(),
            is_completed=False,
            category=Category(name=input.category_name.strip() or "Без категории", color="gray"),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        tasks_db.append(task)
        return task

    @strawberry.mutation
    def complete_task(self, id: strawberry.ID) -> Optional[Task]:
        for task in tasks_db:
            if task.id == id:
                task.is_completed = True
                return task
        return None


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema)

app = FastAPI(title="Task Manager GraphQL API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(graphql_app, prefix="/graphql")


@app.get("/")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "graphql": "/graphql"}
