import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { useTodos } from '../hooks/useTodos';
import { useToggleTodo, useDeleteTodo } from '../hooks/useTodoMutations';
import { TodoFilter } from '../components/todo/TodoFilter';
import { TodoList } from '../components/todo/TodoList';
import { DeleteConfirmModal } from '../components/todo/DeleteConfirmModal';
import { ThemeToggle } from '../components/common/ThemeToggle';
import type { TodoFilters } from '../types/api';

export function TodoListPage() {
  const [filters, setFilters] = useState<TodoFilters>({});
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categoriesData } = useCategories();
  const { data: todosData, isLoading } = useTodos(filters, page);
  const { mutate: toggleTodo, isPending: isToggling, variables: togglingId } = useToggleTodo();
  const { mutate: deleteTodo, isPending: isDeleting } = useDeleteTodo();

  const currentUser = useAuthStore((s) => s.currentUser);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const categories = categoriesData ?? [];
  const todos = todosData?.todos ?? [];
  const pagination = todosData?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  const handleFilterChange = (newFilters: TodoFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <>
      <header className="app-header">
        <h1 className="app-header-title">TodoListApp</h1>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          {currentUser && <span>{currentUser.name}님</span>}
          <ThemeToggle />
          <button className="btn btn-ghost" onClick={() => navigate('/categories')}>
            카테고리 관리
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 desktop:px-6 py-6">
        <TodoFilter
          filters={filters}
          categories={categories}
          onChange={handleFilterChange}
        />

        <div className="card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <button
              className="btn btn-fab"
              onClick={() => navigate('/todos/new')}
            >
              + 새로운 할일 추가
            </button>
            {pagination && (
              <span className="text-sm text-text-secondary">
                총 {pagination.total}개
              </span>
            )}
          </div>

          <TodoList
            todos={todos}
            categories={categories}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onEdit={(id) => navigate(`/todos/${id}/edit`)}
            onDelete={(id) => setDeletingId(id)}
            onToggle={(id) => toggleTodo(id)}
            togglingId={isToggling ? togglingId : null}
          />
        </div>
      </main>

      {deletingId && (
        <DeleteConfirmModal
          onConfirm={() => {
            deleteTodo(deletingId);
            setDeletingId(null);
          }}
          onCancel={() => setDeletingId(null)}
          isPending={isDeleting}
        />
      )}
    </>
  );
}
