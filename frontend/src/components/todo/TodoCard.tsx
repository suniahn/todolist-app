import type { Todo } from '../../types/domain';

interface TodoCardProps {
  todo: Todo;
  categoryName: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  isToggling?: boolean;
}

export function TodoCard({
  todo,
  categoryName,
  onEdit,
  onDelete,
  onToggle,
  isToggling = false,
}: TodoCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = !todo.is_completed && todo.due_date < today;

  return (
    <div className="card p-4 mb-2">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.is_completed}
          onChange={onToggle}
          disabled={isToggling}
          className="mt-0.5 w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium break-words ${
              todo.is_completed ? 'todo-completed' : 'text-text-primary'
            }`}
          >
            {todo.title}
          </p>

          <div className="mt-2">
            <span className="category-chip">{categoryName}</span>
          </div>

          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <span
              className={`text-xs ${
                isOverdue ? 'date-overdue' : 'text-text-secondary'
              }`}
            >
              {todo.start_date} ~ {todo.due_date}
            </span>

            <div className="flex gap-2">
              <button
                className="btn btn-ghost h-8 px-3 text-xs"
                onClick={onEdit}
              >
                수정
              </button>
              <button
                className="btn btn-danger h-8 px-3 text-xs"
                onClick={onDelete}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
