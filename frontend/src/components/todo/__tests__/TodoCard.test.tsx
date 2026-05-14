import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoCard } from '../TodoCard';
import type { Todo } from '../../../types/domain';

const mockTodo: Todo = {
  id: 'todo-001',
  user_id: 'user-001',
  category_id: 'cat-001',
  title: '주간 보고서 작성',
  description: null,
  start_date: '2026-05-14',
  due_date: '2026-05-20',
  is_completed: false,
  completed_at: null,
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

const overdueTodo: Todo = {
  ...mockTodo,
  id: 'todo-002',
  title: '마트 장보기',
  due_date: '2026-05-10',
};

const completedTodo: Todo = {
  ...mockTodo,
  id: 'todo-003',
  title: '운동 30분',
  is_completed: true,
  completed_at: '2026-05-14T09:00:00Z',
};

const completedOverdueTodo: Todo = {
  ...overdueTodo,
  id: 'todo-004',
  title: '완료된 기간초과 할일',
  is_completed: true,
  completed_at: '2026-05-14T09:00:00Z',
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TodoCard', () => {
  describe('기본 렌더링', () => {
    it('할일 제목이 표시된다', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onToggle = vi.fn();

      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      );

      expect(screen.getByText('주간 보고서 작성')).toBeInTheDocument();
    });

    it('카테고리 이름이 표시된다', () => {
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText('업무')).toBeInTheDocument();
    });

    it('시작일이 표시된다', () => {
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText(/2026-05-14/)).toBeInTheDocument();
    });

    it('종료예정일이 표시된다', () => {
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText(/2026-05-20/)).toBeInTheDocument();
    });
  });

  describe('완료 상태 스타일', () => {
    it('미완료 todo: 제목에 취소선이 없다', () => {
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      const title = screen.getByText('주간 보고서 작성');
      expect(title).not.toHaveClass('line-through');
      expect(title.closest('[class*="todo-completed"]')).toBeNull();
    });

    it('완료된 todo: 제목에 취소선이 있다', () => {
      renderWithProviders(
        <TodoCard
          todo={completedTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      const title = screen.getByText('운동 30분');
      const hasLineThrough =
        title.classList.contains('line-through') ||
        title.closest('[class*="todo-completed"]') !== null ||
        window.getComputedStyle(title).textDecoration.includes('line-through');

      expect(hasLineThrough).toBe(true);
    });
  });

  describe('기간초과 스타일', () => {
    it('기간초과 todo: overdue 스타일이 적용된다', () => {
      const { container } = renderWithProviders(
        <TodoCard
          todo={overdueTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      const hasOverdueStyle =
        container.querySelector('[class*="overdue"]') !== null ||
        container.querySelector('[class*="danger"]') !== null ||
        container.querySelector('[class*="text-red"]') !== null ||
        container.innerHTML.includes('overdue') ||
        container.innerHTML.includes('danger');

      expect(hasOverdueStyle).toBe(true);
    });

    it('완료된 todo는 기간초과여도 overdue 스타일이 없다', () => {
      const { container } = renderWithProviders(
        <TodoCard
          todo={completedOverdueTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      const hasOverdueStyle =
        container.querySelector('[class*="date-overdue"]') !== null ||
        container.querySelector('[class*="text-danger"]') !== null;

      expect(hasOverdueStyle).toBe(false);
    });
  });

  describe('액션 버튼', () => {
    it('수정 버튼이 있다', () => {
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      const editButton =
        screen.queryByRole('button', { name: '수정' }) ||
        screen.queryByLabelText('수정');

      expect(editButton).toBeInTheDocument();
    });

    it('삭제 버튼이 있다', () => {
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      const deleteButton =
        screen.queryByRole('button', { name: '삭제' }) ||
        screen.queryByLabelText('삭제');

      expect(deleteButton).toBeInTheDocument();
    });

    it('수정 버튼 클릭 시 onEdit가 호출된다', () => {
      const onEdit = vi.fn();
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={onEdit}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      const editButton =
        screen.queryByRole('button', { name: '수정' }) ??
        screen.getByLabelText('수정');

      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('삭제 버튼 클릭 시 onDelete가 호출된다', () => {
      const onDelete = vi.fn();
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={onDelete}
          onToggle={vi.fn()}
        />
      );

      const deleteButton =
        screen.queryByRole('button', { name: '삭제' }) ??
        screen.getByLabelText('삭제');

      fireEvent.click(deleteButton);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('체크박스', () => {
    it('체크박스가 있다', () => {
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('체크박스 클릭 시 onToggle이 호출된다', () => {
      const onToggle = vi.fn();
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={onToggle}
        />
      );

      fireEvent.click(screen.getByRole('checkbox'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('isToggling=true일 때 체크박스가 비활성화된다', () => {
      renderWithProviders(
        <TodoCard
          todo={mockTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
          isToggling={true}
        />
      );

      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('완료된 todo의 체크박스는 checked이다', () => {
      renderWithProviders(
        <TodoCard
          todo={completedTodo}
          categoryName="업무"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });
});
