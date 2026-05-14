import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { todosApi } from '../api/todos';
import { useCategories } from '../hooks/useCategories';
import { useUpdateTodo } from '../hooks/useTodoMutations';
import { TodoForm } from '../components/todo/TodoForm';
import { ThemeToggle } from '../components/common/ThemeToggle';
import type { CreateTodoPayload } from '../types/api';

export function TodoEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: categoriesData } = useCategories();
  const { mutate: updateTodo, isPending } = useUpdateTodo();

  const { data: todo, isLoading } = useQuery({
    queryKey: ['todos', 'detail', id],
    queryFn: () => todosApi.fetchTodo(id!),
    enabled: id !== undefined,
  });

  const categories = categoriesData ?? [];

  const handleSubmit = (payload: CreateTodoPayload) => {
    if (!id) return;
    updateTodo({ id, payload });
  };

  if (isLoading || !todo) {
    return (
      <>
        <header className="app-header" role="banner">
          <h1 className="app-header-title">TodoListApp</h1>
        </header>
        <main className="max-w-[640px] mx-auto px-4 py-6">
          <p className="text-text-secondary">불러오는 중...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="app-header" role="banner">
        <h1 className="app-header-title">TodoListApp</h1>
        <ThemeToggle />
      </header>
      <TodoForm
        initialValues={{
          title: todo.title,
          description: todo.description ?? undefined,
          start_date: todo.start_date,
          due_date: todo.due_date,
          category_id: todo.category_id,
        }}
        categories={categories}
        onSubmit={handleSubmit}
        isPending={isPending}
        submitLabel="저장"
        onCancel={() => navigate('/')}
      />
    </>
  );
}
