import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { COMPLETE_TASK, CREATE_TASK } from "./graphql/mutations";
import { GET_TASKS } from "./graphql/queries";

function TaskList() {
  const { data, loading, error } = useQuery(GET_TASKS);
  const [completeTask, { loading: completing }] = useMutation(COMPLETE_TASK, {
    refetchQueries: [{ query: GET_TASKS }],
    awaitRefetchQueries: true,
  });

  if (loading) return <p className="state">Загрузка задач...</p>;
  if (error) {
    return (
      <p className="state state-error">
        Не удалось загрузить задачи. Проверьте, запущен ли GraphQL-сервер.
      </p>
    );
  }

  const tasks = data?.allTasks ?? [];
  return (
    <section className="task-list" aria-label="Список задач">
      {tasks.map((task) => (
        <article className={`task ${task.isCompleted ? "task-completed" : ""}`} key={task.id}>
          <div className="task-content">
            <div className="task-heading">
              <h2>{task.title}</h2>
              <span className={`tag tag-${task.category.color}`}>{task.category.name}</span>
            </div>
            <p>{task.description || "Описание не задано"}</p>
            <small>Создана: {new Date(task.createdAt).toLocaleDateString("ru-RU")}</small>
          </div>
          <button
            className="complete-button"
            type="button"
            disabled={task.isCompleted || completing}
            onClick={() => completeTask({ variables: { id: task.id } })}
          >
            {task.isCompleted ? "Выполнена" : "Завершить"}
          </button>
        </article>
      ))}
    </section>
  );
}

function CreateTaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryName, setCategoryName] = useState("Учёба");
  const [formError, setFormError] = useState("");
  const [createTask, { loading }] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: GET_TASKS }],
    awaitRefetchQueries: true,
  });

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setFormError("Введите название задачи.");
      return;
    }
    setFormError("");
    try {
      await createTask({
        variables: {
          input: { title, description, categoryName },
        },
      });
      setTitle("");
      setDescription("");
      setCategoryName("Учёба");
    } catch {
      setFormError("Не удалось создать задачу. Повторите попытку.");
    }
  }

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Новая запись</p>
          <h2>Создать задачу</h2>
        </div>
        <span className="form-icon">+</span>
      </div>
      <label>
        Название
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, повторить запросы" />
      </label>
      <label>
        Описание
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="3" placeholder="Коротко опишите задачу" />
      </label>
      <label>
        Категория
        <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
      </label>
      {formError && <p className="form-error">{formError}</p>}
      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Создание..." : "Добавить задачу"}
      </button>
    </form>
  );
}

export default function App() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Apollo Client / GraphQL</p>
          <h1>Менеджер задач</h1>
          <p className="subtitle">Рабочий список с данными из Strawberry API</p>
        </div>
        <div className="connection-status"><span /> API подключён</div>
      </header>
      <div className="workspace-grid">
        <div className="tasks-column">
          <div className="section-heading"><h2>Все задачи</h2><span>Актуальный список</span></div>
          <TaskList />
        </div>
        <CreateTaskForm />
      </div>
    </main>
  );
}
