import { useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useCreateTodo } from '../hooks/useTodoMutations';
import { TodoForm } from '../components/todo/TodoForm';
import { ThemeToggle } from '../components/common/ThemeToggle';
import type { CreateTodoPayload } from '../types/api';

export function TodoCreatePage() {
  const navigate = useNavigate();
  const { data: categoriesData } = useCategories();
  const { mutate: createTodo, isPending } = useCreateTodo();

  const categories = categoriesData ?? [];

  const handleSubmit = (payload: CreateTodoPayload) => {
    createTodo(payload);
  };

  return (
    <>
      <header className="app-header" role="banner">
        <h1 className="app-header-title">TodoListApp</h1>
        <ThemeToggle />
      </header>
      <TodoForm
        initialValues={{}}
        categories={categories}
        onSubmit={handleSubmit}
        isPending={isPending}
        submitLabel="등록"
        onCancel={() => navigate('/')}
      />
    </>
  );
}
