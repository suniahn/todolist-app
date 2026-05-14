import type { Todo, Category } from '../../types/domain';
import { TodoCard } from './TodoCard';

interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  togglingId?: string | null;
}

function SkeletonRow() {
  return (
    <div className="card p-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="skeleton w-4 h-4 rounded" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
        </div>
      </div>
    </div>
  );
}

export function TodoList({
  todos,
  categories,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onToggle,
  togglingId,
}: TodoListProps) {
  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? '알 수 없음';

  const today = new Date().toISOString().split('T')[0];

  const isOverdue = (todo: Todo) =>
    !todo.is_completed && todo.due_date < today;

  if (isLoading) {
    return (
      <div className="p-4">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-secondary">
        <p className="text-base font-medium">할일이 없습니다</p>
        <p className="text-sm">첫 번째 할일을 추가해보세요!</p>
      </div>
    );
  }

  const pagination = (
    <div className="pagination border-t border-border">
      <button
        className="pagination-btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="이전 페이지"
      >
        ‹
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button
        className="pagination-btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden desktop:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-left">
              <th className="p-3 w-10 font-medium">완료</th>
              <th className="p-3 font-medium">제목</th>
              <th className="p-3 w-32 font-medium">카테고리</th>
              <th className="p-3 w-28 font-medium">시작일</th>
              <th className="p-3 w-28 font-medium">종료예정일</th>
              <th className="p-3 w-24 font-medium" />
            </tr>
          </thead>
          <tbody>
            {todos.map((todo) => (
              <tr
                key={todo.id}
                className={`border-b border-border hover:bg-[#F8F9FA] transition-colors ${
                  todo.is_completed ? 'opacity-70' : ''
                }`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={todo.is_completed}
                    onChange={() => onToggle(todo.id)}
                    disabled={togglingId === todo.id}
                    className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                </td>
                <td className="p-3">
                  <span
                    className={
                      todo.is_completed ? 'todo-completed' : 'text-text-primary'
                    }
                  >
                    {todo.title}
                  </span>
                </td>
                <td className="p-3">
                  <span className="category-chip">
                    {getCategoryName(todo.category_id)}
                  </span>
                </td>
                <td className="p-3 text-text-secondary">{todo.start_date}</td>
                <td className="p-3">
                  <span
                    className={
                      isOverdue(todo) ? 'date-overdue' : 'text-text-secondary'
                    }
                  >
                    {todo.due_date}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1 justify-end">
                    <button
                      className="btn btn-ghost h-8 px-2 text-xs"
                      onClick={() => onEdit(todo.id)}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-danger h-8 px-2 text-xs"
                      onClick={() => onDelete(todo.id)}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="desktop:hidden p-4">
        {todos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            categoryName={getCategoryName(todo.category_id)}
            onEdit={() => onEdit(todo.id)}
            onDelete={() => onDelete(todo.id)}
            onToggle={() => onToggle(todo.id)}
            isToggling={togglingId === todo.id}
          />
        ))}
      </div>

      {totalPages > 1 && pagination}
    </>
  );
}
